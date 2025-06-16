import {
  users,
  classes,
  students,
  classEnrollments,
  attendanceRecords,
  consultations as consultationsTable,
  grades,
  type User,
  type InsertUser,
  type Class,
  type InsertClass,
  type Student,
  type InsertStudent,
  type AttendanceRecord,
  type InsertAttendanceRecord,
  type Consultation,
  type InsertConsultation,
  type Grade,
  type InsertGrade,
  teacherAvailability,
  assignments,
} from "@shared/schema";
import { db, connection } from './db';
import { eq, sql, ne, and } from 'drizzle-orm';

export interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Class operations
  getClasses(): Promise<Class[]>;
  getClassesByTeacher(teacherId: number): Promise<Class[]>;
  getClass(id: number): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: number, classData: Partial<InsertClass>): Promise<Class>;
  deleteClass(id: number): Promise<void>;
  
  // Student operations
  getStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByUserId(userId: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  getStudentsByClass(classId: number): Promise<Student[]>;
  
  // Attendance operations
  getAttendanceRecords(classId: number, date?: Date): Promise<AttendanceRecord[]>;
  markAttendance(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  updateAttendance(id: number, status: string): Promise<AttendanceRecord>;
  getAttendanceStats(studentId: number): Promise<any>;
  
  // Consultation operations
  getConsultations(): Promise<Consultation[]>;
  getConsultationsByTeacher(teacherId: number): Promise<Consultation[]>;
  getConsultationsByStudent(studentId: number): Promise<Consultation[]>;
  createConsultation(consultation: InsertConsultation): Promise<Consultation>;
  updateConsultation(id: number, updates: Partial<InsertConsultation>): Promise<Consultation>;

  // Teacher availability operations
  getTeacherAvailability(teacherId: number): Promise<TimeSlot[]>;
  updateTeacherAvailability(teacherId: number, timeSlots: TimeSlot[]): Promise<TimeSlot[]>;
  getAvailableTimeSlots(teacherId: number, date: Date): Promise<TimeSlot[]>;

  // Get all teachers
  getTeachers(): Promise<User[]>;

  // New method
  getClassesByStudent(studentId: number): Promise<Class[]>;
}

export class DbStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    // Drizzle ORM query
    return await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, id) });
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    // Drizzle ORM query
    return await db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, email) });
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await connection.query(
      'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
      [user.email, user.password, user.firstName, user.lastName, user.role]
    );
    // @ts-ignore
    return this.getUser(result[0].insertId) as Promise<User>;
  }

  // Class operations
  async getClasses(): Promise<Class[]> {
    const [rows] = await connection.query('SELECT * FROM classes ORDER BY created_at DESC');
    return rows as Class[];
  }

  async getClassesByTeacher(teacherId: number): Promise<Class[]> {
    const [rows] = await connection.query('SELECT * FROM classes WHERE teacher_id = ? ORDER BY created_at DESC', [teacherId]);
    return rows as Class[];
  }

  async getClass(id: number): Promise<Class | undefined> {
    const [rows] = await connection.query('SELECT * FROM classes WHERE id = ?', [id]);
    const classes = rows as Class[];
    return classes.length > 0 ? classes[0] : undefined;
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const result = await connection.query(
      'INSERT INTO classes (name, code, teacher_id, room, max_students, schedule, semester, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [classData.name, classData.code, classData.teacherId, classData.room, classData.maxStudents, classData.schedule, classData.semester, classData.description]
    );
    // @ts-ignore
    return this.getClass(result[0].insertId) as Promise<Class>;
  }

  async updateClass(id: number, updates: Partial<InsertClass>): Promise<Class> {
    const setParts = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        setParts.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (setParts.length > 0) {
      values.push(id);
      await connection.query(`UPDATE classes SET ${setParts.join(', ')} WHERE id = ?`, values);
    }

    return this.getClass(id) as Promise<Class>;
  }

  async deleteClass(id: number): Promise<void> {
    await connection.query('DELETE FROM classes WHERE id = ?', [id]);
  }

  // Student operations
  async getStudents(): Promise<Student[]> {
    const [rows] = await connection.query('SELECT * FROM students');
    return rows as Student[];
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const [rows] = await connection.query('SELECT * FROM students WHERE id = ?', [id]);
    const students = rows as Student[];
    return students.length > 0 ? students[0] : undefined;
  }

  async getStudentByUserId(userId: number): Promise<Student | undefined> {
    const [rows] = await connection.query('SELECT * FROM students WHERE user_id = ?', [userId]);
    const students = rows as Student[];
    return students.length > 0 ? students[0] : undefined;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const result = await connection.query(
      'INSERT INTO students (user_id, student_id, year, program, gpa) VALUES (?, ?, ?, ?, ?)',
      [student.userId, student.studentId, student.year, student.program, student.gpa]
    );
    // @ts-ignore
    return this.getStudent(result[0].insertId) as Promise<Student>;
  }

  async getStudentsByClass(classId: number): Promise<Student[]> {
    const [rows] = await connection.query(`
      SELECT s.* FROM students s
      JOIN class_enrollments ce ON s.id = ce.student_id
      WHERE ce.class_id = ?
    `, [classId]);
    return rows as Student[];
  }
  // Attendance operations
  async getAttendanceRecords(classId: number, date?: Date): Promise<AttendanceRecord[]> {
    let query = 'SELECT * FROM attendance_records WHERE class_id = ?';
    const params: any[] = [classId];

    if (date) {
      query += ' AND DATE(date) = ?';
      params.push(date.toISOString().split('T')[0]);
    }

    query += ' ORDER BY date DESC';

    const [rows] = await connection.query(query, params);
    return rows as AttendanceRecord[];
  }

  async markAttendance(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const result = await connection.query(
      'INSERT INTO attendance_records (class_id, student_id, date, status, marked_by) VALUES (?, ?, ?, ?, ?)',
      [record.classId, record.studentId, record.date, record.status, record.markedBy]
    );
    // @ts-ignore
    const [rows] = await connection.query('SELECT * FROM attendance_records WHERE id = ?', [result[0].insertId]);
    return (rows as AttendanceRecord[])[0];
  }

  async updateAttendance(id: number, status: string): Promise<AttendanceRecord> {
    await connection.query('UPDATE attendance_records SET status = ? WHERE id = ?', [status, id]);
    const [rows] = await connection.query('SELECT * FROM attendance_records WHERE id = ?', [id]);
    return (rows as AttendanceRecord[])[0];
  }

  async getAttendanceStats(studentId: number): Promise<any> {
    const [rows] = await connection.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
      FROM attendance_records
      WHERE student_id = ?
    `, [studentId]);
    return (rows as any[])[0];
  }

  // Consultation operations
  async getConsultations(): Promise<Consultation[]> {
    const [rows] = await connection.query('SELECT * FROM consultations ORDER BY date_time DESC');
    return rows as Consultation[];
  }

  async getConsultationsByTeacher(teacherId: number): Promise<Consultation[]> {
    const [rows] = await connection.query(`
      SELECT c.*,
             CONCAT(u.first_name, ' ', u.last_name) as student_name,
             s.student_id as student_number,
             DATE_FORMAT(c.date_time, '%Y-%m-%d %H:%i:%s') as date_time
      FROM consultations c
      JOIN students s ON c.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE c.teacher_id = ?
      ORDER BY c.date_time DESC
    `, [teacherId]);
    return rows as any[];
  }

  async getConsultationsByStudent(studentId: number): Promise<Consultation[]> {
    const [rows] = await connection.query(`
      SELECT c.*,
             CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
             DATE_FORMAT(c.date_time, '%Y-%m-%dT%H:%i:%s') as date_time
      FROM consultations c
      JOIN users u ON c.teacher_id = u.id
      WHERE c.student_id = ?
      ORDER BY c.date_time DESC
    `, [studentId]);
    return rows as any[];
  }

  async createConsultation(consultation: InsertConsultation): Promise<Consultation> {
    const result = await connection.query(
      'INSERT INTO consultations (teacher_id, student_id, date_time, duration, purpose, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [consultation.teacherId, consultation.studentId, consultation.dateTime, consultation.duration, consultation.purpose, consultation.status, consultation.notes]
    );
    // @ts-ignore
    const [rows] = await connection.query('SELECT * FROM consultations WHERE id = ?', [result[0].insertId]);
    return (rows as Consultation[])[0];
  }

  async updateConsultation(id: number, updates: Partial<InsertConsultation>): Promise<Consultation> {
    const setParts = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        setParts.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (setParts.length > 0) {
      values.push(id);
      await connection.query(`UPDATE consultations SET ${setParts.join(', ')} WHERE id = ?`, values);
    }

    const [rows] = await connection.query('SELECT * FROM consultations WHERE id = ?', [id]);
    return (rows as Consultation[])[0];
  }

  // Grade operations
  async getGradesByStudent(studentId: number): Promise<Grade[]> {
    const [rows] = await connection.query(`
      SELECT g.*, a.title as assignment_title, a.type as assignment_type, c.name as class_name
      FROM grades g
      JOIN assignments a ON g.assignment_id = a.id
      JOIN classes c ON a.class_id = c.id
      WHERE g.student_id = ?
      ORDER BY g.graded_at DESC
    `, [studentId]);
    return rows as any[];
  }

  async getGradesByClass(classId: number): Promise<Grade[]> {
    const [rows] = await connection.query(`
      SELECT g.*, a.title as assignment_title, a.type as assignment_type,
             CONCAT(u.first_name, ' ', u.last_name) as student_name
      FROM grades g
      JOIN assignments a ON g.assignment_id = a.id
      JOIN students s ON g.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE a.class_id = ?
      ORDER BY g.graded_at DESC
    `, [classId]);
    return rows as any[];
  }

  getTeacherAvailability = async (teacherId: number): Promise<TimeSlot[]> => {
    const slots = await db.select({
      day: teacherAvailability.day,
      startTime: teacherAvailability.startTime,
      endTime: teacherAvailability.endTime,
    })
    .from(teacherAvailability)
    .where(eq(teacherAvailability.teacherId, teacherId));

    // Format time values to ensure they are in HH:mm format
    return slots.map(slot => ({
      day: slot.day,
      startTime: slot.startTime.substring(0, 5), // Extract HH:mm from HH:mm:ss
      endTime: slot.endTime.substring(0, 5), // Extract HH:mm from HH:mm:ss
    }));
  };
  updateTeacherAvailability = async (teacherId: number, timeSlots: TimeSlot[]): Promise<TimeSlot[]> => {
    try {
      // Validate input
      if (!teacherId || !timeSlots || !Array.isArray(timeSlots)) {
        throw new Error("Invalid input: teacherId and timeSlots array are required");
      }

      // Validate each time slot
      for (const slot of timeSlots) {
        if (!slot.day || !slot.startTime || !slot.endTime) {
          throw new Error("Invalid time slot: day, startTime, and endTime are required");
        }
      }

      console.log("Starting availability update for teacher:", teacherId);
      console.log("Time slots to update:", timeSlots);

      // Start a transaction
      await connection.query('START TRANSACTION');

      try {
        // First delete existing slots
        console.log("Deleting existing slots...");
        await connection.query(
          'DELETE FROM teacher_availability WHERE teacher_id = ?',
          [teacherId]
        );

        // Then insert new slots
        console.log("Inserting new slots...");
        for (const slot of timeSlots) {
          // Format time values to ensure they are in HH:mm:ss format
          const startTime = slot.startTime.padEnd(8, ':00');
          const endTime = slot.endTime.padEnd(8, ':00');

          console.log("Inserting slot:", { day: slot.day, startTime, endTime });

          await connection.query(
            'INSERT INTO teacher_availability (teacher_id, day, start_time, end_time) VALUES (?, ?, ?, ?)',
            [teacherId, slot.day, startTime, endTime]
          );
        }

        // Commit the transaction
        await connection.query('COMMIT');

        // Return the updated slots
        const [updatedSlots] = await connection.query(
          'SELECT day, TIME_FORMAT(start_time, "%H:%i") as startTime, TIME_FORMAT(end_time, "%H:%i") as endTime FROM teacher_availability WHERE teacher_id = ?',
          [teacherId]
        );

        console.log("Updated slots:", updatedSlots);
        return updatedSlots as TimeSlot[];
      } catch (error) {
        // Rollback the transaction if there's an error
        console.error("Error during transaction, rolling back:", error);
        await connection.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error("Error updating teacher availability:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to update availability: ${error.message}`);
      }
      throw new Error("Failed to update availability: Unknown error");
    }
  };
  getAvailableTimeSlots = async (teacherId: number, date: Date): Promise<TimeSlot[]> => {
    // Get the day of the week (0-6, where 0 is Sunday)
    const dayOfWeek = date.getDay();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const day = days[dayOfWeek];

    // Get teacher's availability for the day
    const [availabilityRows] = await connection.query(
      'SELECT * FROM teacher_availability WHERE teacher_id = ? AND day = ?',
      [teacherId, day]
    );
    const availability = availabilityRows as TimeSlot[];

    // Get existing consultations for the date
    const [consultationRows] = await connection.query(
      'SELECT DATE_FORMAT(date_time, "%H:%i") as time FROM consultations WHERE teacher_id = ? AND DATE(date_time) = ?',
      [teacherId, date.toISOString().split('T')[0]]
    );
    const bookedTimes = (consultationRows as { time: string }[]).map(row => row.time);

    // Generate 30-minute slots and filter out booked times
    const availableSlots: TimeSlot[] = [];
    
    for (const slot of availability) {
      let currentTime = slot.startTime;
      const endTime = slot.endTime;

      while (currentTime < endTime) {
        // Check if this 30-minute slot is available
        const isBooked = bookedTimes.some(bookedTime => {
          const [bookedHour, bookedMinute] = bookedTime.split(':').map(Number);
          const [currentHour, currentMinute] = currentTime.split(':').map(Number);
          
          // Check if the booked time falls within this 30-minute slot
          return (
            (bookedHour === currentHour && bookedMinute >= currentMinute && bookedMinute < currentMinute + 30) ||
            (bookedHour === currentHour + 1 && currentMinute >= 30 && bookedMinute < (currentMinute + 30) % 60)
          );
        });

        if (!isBooked) {
          // Calculate end time for this 30-minute slot
          const [hours, minutes] = currentTime.split(':').map(Number);
          const slotEndDate = new Date();
          slotEndDate.setHours(hours, minutes + 30);
          const slotEndTime = `${String(slotEndDate.getHours()).padStart(2, '0')}:${String(slotEndDate.getMinutes()).padStart(2, '0')}`;

          availableSlots.push({
            day,
            startTime: currentTime,
            endTime: slotEndTime
          });
        }

        // Move to next 30-minute slot
        const [hours, minutes] = currentTime.split(':').map(Number);
        const nextSlotDate = new Date();
        nextSlotDate.setHours(hours, minutes + 30);
        currentTime = `${String(nextSlotDate.getHours()).padStart(2, '0')}:${String(nextSlotDate.getMinutes()).padStart(2, '0')}`;
      }
    }

    return availableSlots;
  };

  // Get all teachers
  async getTeachers(): Promise<User[]> {
    const [rows] = await connection.query(
      'SELECT id, email, first_name, last_name FROM users WHERE role = "teacher"'
    );
    return rows as User[];
  }

  async getClassesByStudent(studentId: number): Promise<Class[]> {
    const [rows] = await connection.query(`
      SELECT c.*, 
             CONCAT(u.first_name, ' ', u.last_name) as teacher_name
      FROM classes c
      JOIN class_enrollments ce ON c.id = ce.class_id
      JOIN users u ON c.teacher_id = u.id
      WHERE ce.student_id = ?
      ORDER BY c.name
    `, [studentId]);
    return rows as Class[];
  }
}

// Switch to database-backed storage
export const storage = new DbStorage();
// export const storage = new MemStorage(); // (for mock/testing)



