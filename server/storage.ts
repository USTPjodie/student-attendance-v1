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
import { ResultSetHeader } from 'mysql2';

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

  // Booking operations
  getBookingsByTeacher(teacherId: number): Promise<Booking[]>;
  getBookingsByStudent(studentId: number): Promise<Booking[]>;

  // Teacher availability operations
  getTeacherAvailability(teacherId: number): Promise<TimeSlot[]>;
  updateTeacherAvailability(teacherId: number, timeSlots: TimeSlot[]): Promise<TimeSlot[]>;
  getAvailableTimeSlots(teacherId: number, date: Date): Promise<TimeSlot[]>;
  getBookedTimeSlots(teacherId: number, date: Date): Promise<TimeSlot[]>;

  // Get all teachers
  getTeachers(): Promise<User[]>;

  // New method
  getClassesByStudent(studentId: number): Promise<Class[]>;

  getTeacherByUserId(userId: number): Promise<User | undefined>;
}

interface ConsultationSlot {
  id: number;
  teacherId: number;
  startTime: string;
  endTime: string;
  status: 'available' | 'booked' | 'pending_approval';
  isActive: boolean;
}

interface Booking {
  id: number;
  slotId: number;
  studentId: number;
  consultationId: number;
  status: 'pending' | 'approved' | 'rejected';
  purpose: string;
  teacherNotes: string | null;
  createdAt: string;
  teacher?: {
    firstName: string;
    lastName: string;
  };
  dateTime?: string; // Add this property
  teacherId?: number; // Add this property
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
    const [rows] = await connection.query(`
      SELECT c.*,
             CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
             u.first_name as teacher_first_name,
             u.last_name as teacher_last_name,
             DATE_FORMAT(c.date_time, '%Y-%m-%dT%H:%i:%s') as date_time
      FROM consultations c
      JOIN users u ON c.teacher_id = u.id
      ORDER BY c.date_time DESC
    `);
    return rows as any[];
  }

  async getConsultationsByTeacher(teacherId: number): Promise<Consultation[]> {
    const [rows] = await connection.query(`
      SELECT c.*,
             u.first_name as student_first_name,
             u.last_name as student_last_name,
             s.student_id as student_number,
             DATE_FORMAT(c.date_time, '%Y-%m-%dT%H:%i:%s') as date_time,
             c.created_at as created_at
      FROM consultations c
      JOIN students s ON c.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE c.teacher_id = ?
      ORDER BY c.date_time DESC
    `, [teacherId]);
    
    // Transform the rows to match the expected format
    return (rows as any[]).map(row => {
      const { date_time, student_first_name, student_last_name, student_number, created_at, ...rest } = row;
      return {
        id: rest.id,
        teacherId: rest.teacher_id,
        studentId: rest.student_id,
        duration: rest.duration,
        purpose: rest.purpose,
        status: rest.status,
        notes: rest.notes,
        bookingId: rest.booking_id || null,
        dateTime: date_time, // Ensure dateTime is a string
        createdAt: created_at, // Ensure createdAt is a string
        student: {
          firstName: student_first_name,
          lastName: student_last_name
        }
      } as Consultation;
    });
  }

  async getConsultationsByStudent(studentId: number): Promise<Consultation[]> {
    const [rows] = await connection.query(`
      SELECT c.*,
             u.first_name as teacher_first_name,
             u.last_name as teacher_last_name,
             DATE_FORMAT(c.date_time, '%Y-%m-%dT%H:%i:%s') as date_time
      FROM consultations c
      JOIN users u ON c.teacher_id = u.id
      WHERE c.student_id = ?
      ORDER BY c.date_time DESC
    `, [studentId]);

    // Transform the rows to match the expected format
    return (rows as any[]).map(row => ({
      ...row,
      teacher: {
        firstName: row.teacher_first_name,
        lastName: row.teacher_last_name
      },
      dateTime: row.date_time, // Ensure dateTime is a string
      createdAt: row.created_at // Ensure createdAt is a string
    }));
  }

  async createConsultation(consultation: InsertConsultation): Promise<Consultation> {
    try {
      console.log('Creating consultation with data:', consultation);
      
      // Format the date for MySQL
      const formattedDateTime = new Date(consultation.dateTime).toISOString().slice(0, 19).replace('T', ' ');
      
      const [result] = await connection.query(
        'INSERT INTO consultations (teacher_id, student_id, date_time, duration, purpose, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [consultation.teacherId, consultation.studentId, formattedDateTime, consultation.duration, consultation.purpose, consultation.status, consultation.notes || null]
      ) as [ResultSetHeader, any];
      
      // Get the created consultation with teacher information
      const [rows] = await connection.query(`
        SELECT c.*,
               u.first_name as teacher_first_name,
               u.last_name as teacher_last_name,
               DATE_FORMAT(c.date_time, '%Y-%m-%dT%H:%i:%s') as date_time
        FROM consultations c
        JOIN users u ON c.teacher_id = u.id
        WHERE c.id = ?
      `, [result.insertId]);

      // Transform the row to match the expected format
      const row = (rows as any[])[0];
      return {
        ...row,
        teacher: {
          firstName: row.teacher_first_name,
          lastName: row.teacher_last_name
        }
      };
    } catch (error) {
      console.error('Error creating consultation:', error);
      throw error;
    }
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

    // If the consultation is being approved, update the teacher's availability
    if (updates.status === 'approved') {
      const [consultation] = await connection.query(
        'SELECT date_time, duration FROM consultations WHERE id = ?',
        [id]
      ) as [any[], any];

      if (consultation.length > 0) {
        const { date_time, duration } = consultation[0];
        const startTime = new Date(date_time);
        const endTime = new Date(startTime.getTime() + duration * 60000); // Convert duration to milliseconds

        // Insert the booked time slot into teacher_availability
        await connection.query(
          'INSERT INTO teacher_availability (teacher_id, day, start_time, end_time) VALUES (?, ?, ?, ?)',
          [
            updates.teacherId,
            startTime.toLocaleDateString('en-US', { weekday: 'long' }),
            startTime.toTimeString().slice(0, 8),
            endTime.toTimeString().slice(0, 8)
          ]
        );
      }
    }

    // Get the updated consultation with teacher information
    const [rows] = await connection.query(`
      SELECT c.*,
             u.first_name as teacher_first_name,
             u.last_name as teacher_last_name,
             DATE_FORMAT(c.date_time, '%Y-%m-%dT%H:%i:%s') as date_time
      FROM consultations c
      JOIN users u ON c.teacher_id = u.id
      WHERE c.id = ?
    `, [id]);

    // Transform the row to match the expected format
    const row = (rows as any[])[0];
    return {
      ...row,
      teacher: {
        firstName: row.teacher_first_name,
        lastName: row.teacher_last_name
      }
    };
  }

  // Booking operations
  async getBookingsByTeacher(teacherId: number): Promise<Booking[]> {
    const [rows] = await connection.query(`
      SELECT 
        b.*,
        s.student_id as student_number,
        u.first_name as student_first_name,
        u.last_name as student_last_name,
        cs.start_time,
        cs.end_time
      FROM bookings b
      JOIN consultation_slots cs ON b.slot_id = cs.id
      JOIN students s ON b.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE cs.teacher_id = ? AND b.status = 'pending'
      ORDER BY cs.start_time ASC
    `, [teacherId]);

    // Transform the rows to match the expected format
    return (rows as any[]).map(row => ({
      id: row.id,
      slotId: row.slot_id,
      studentId: row.student_id,
      consultationId: row.consultation_id,
      status: row.status,
      purpose: row.purpose,
      teacherNotes: row.teacher_notes,
      createdAt: row.created_at,
      student: {
        firstName: row.student_first_name,
        lastName: row.student_last_name
      },
      dateTime: row.start_time // Add dateTime for consistency with consultations
    }));
  }

  async getBookingsByStudent(studentId: number): Promise<Booking[]> {
    const [rows] = await connection.query(`
      SELECT 
        b.*,
        u.first_name as teacher_first_name,
        u.last_name as teacher_last_name,
        cs.start_time,
        cs.end_time,
        cs.teacher_id as teacher_id
      FROM bookings b
      JOIN consultation_slots cs ON b.slot_id = cs.id
      JOIN users u ON cs.teacher_id = u.id
      WHERE b.student_id = ?
      ORDER BY cs.start_time DESC
    `, [studentId]);

    // Transform the rows to match the expected format
    return (rows as any[]).map(row => ({
      id: row.id,
      slotId: row.slot_id,
      studentId: row.student_id,
      consultationId: row.consultation_id,
      status: row.status,
      purpose: row.purpose,
      teacherNotes: row.teacher_notes,
      createdAt: row.created_at,
      teacher: {
        firstName: row.teacher_first_name,
        lastName: row.teacher_last_name
      },
      dateTime: row.start_time, // Add dateTime for consistency with consultations
      teacherId: row.teacher_id // Add teacherId
    }));
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

  async getTeacherAvailability(teacherId: number): Promise<TimeSlot[]> {
    const [rows] = await connection.query(
      `SELECT 
        day,
        start_time as startTime,
        end_time as endTime
      FROM teacher_availability 
      WHERE teacher_id = ?
      ORDER BY FIELD(day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')`,
      [teacherId]
    );
    return rows as TimeSlot[];
  }

  async updateTeacherAvailability(teacherId: number, timeSlots: TimeSlot[]): Promise<TimeSlot[]> {
    try {
      await connection.query('START TRANSACTION');

      // Delete existing availability
      await connection.query(
        'DELETE FROM teacher_availability WHERE teacher_id = ?',
        [teacherId]
      );

      // Insert new availability
      if (timeSlots.length > 0) {
        const values = timeSlots.map(slot => [
          teacherId,
          slot.day,
          slot.startTime,
          slot.endTime
        ]);

        await connection.query(
          'INSERT INTO teacher_availability (teacher_id, day, start_time, end_time) VALUES ?',
          [values]
        );
      }

      await connection.query('COMMIT');
      return this.getTeacherAvailability(teacherId);
    } catch (error) {
      await connection.query('ROLLBACK');
      throw error;
    }
  }

  async getAvailableTimeSlots(teacherId: number, date: Date): Promise<TimeSlot[]> {
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const formattedDate = date.toISOString().split('T')[0];

    // Get teacher's availability for the day
    const [availabilityRows] = await connection.query(
      'SELECT start_time, end_time FROM teacher_availability WHERE teacher_id = ? AND day = ?',
      [teacherId, dayOfWeek]
    );

    if (!availabilityRows || (availabilityRows as any[]).length === 0) {
      return [];
    }

    // Get booked time slots for the day
    const bookedSlots = await this.getBookedTimeSlots(teacherId, date);

    // Generate available time slots
    const availableSlots: TimeSlot[] = [];
    for (const availability of availabilityRows as any[]) {
      const [startHour, startMinute] = availability.start_time.split(':').map(Number);
      const [endHour, endMinute] = availability.end_time.split(':').map(Number);

      let currentTime = new Date(date);
      currentTime.setHours(startHour, startMinute, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(endHour, endMinute, 0, 0);

      while (currentTime < endTime) {
        const slotEndTime = new Date(currentTime.getTime() + 30 * 60000); // 30 minutes
        if (slotEndTime <= endTime) {
          const slot: TimeSlot = {
            day: dayOfWeek,
            startTime: currentTime.toTimeString().slice(0, 8),
            endTime: slotEndTime.toTimeString().slice(0, 8)
          };

          // Check if this slot overlaps with any booked slots
          const isBooked = bookedSlots.some(booked => {
            const bookedStart = new Date(`${formattedDate}T${booked.startTime}`);
            const bookedEnd = new Date(`${formattedDate}T${booked.endTime}`);
            return (
              (currentTime >= bookedStart && currentTime < bookedEnd) ||
              (slotEndTime > bookedStart && slotEndTime <= bookedEnd) ||
              (currentTime <= bookedStart && slotEndTime >= bookedEnd)
            );
          });

          if (!isBooked) {
            availableSlots.push(slot);
          }
        }
        currentTime = slotEndTime;
      }
    }

    return availableSlots;
  }

  async getBookedTimeSlots(teacherId: number, date: Date): Promise<TimeSlot[]> {
    const formattedDate = date.toISOString().split('T')[0];
    const [rows] = await connection.query(`
      SELECT 
        DATE_FORMAT(date_time, '%W') as day,
        DATE_FORMAT(date_time, '%H:%i:%s') as startTime,
        DATE_FORMAT(DATE_ADD(date_time, INTERVAL duration MINUTE), '%H:%i:%s') as endTime
      FROM consultations 
      WHERE teacher_id = ? 
      AND DATE(date_time) = ?
      AND status = 'approved'
    `, [teacherId, formattedDate]);

    return (rows as any[]).map(row => ({
      day: row.day,
      startTime: row.startTime,
      endTime: row.endTime
    }));
  }

  // Get all teachers
  async getTeachers(): Promise<User[]> {
    const [rows] = await connection.query(
      'SELECT id, email, first_name, last_name FROM users WHERE role = "teacher"'
    );
    return rows as User[];
  }

  async getClassesByStudent(studentId: number): Promise<Class[]> {
    const [rows] = await connection.query(`
      SELECT 
        c.*,
        u.id as teacher_id,
        u.first_name,
        u.last_name
      FROM classes c
      JOIN class_enrollments ce ON c.id = ce.class_id
      JOIN users u ON c.teacher_id = u.id
      WHERE ce.student_id = ?
    `, [studentId]);
    
    // Map the rows to match the Class type
    return (rows as any[]).map(row => ({
      id: row.id,
      name: row.name,
      code: row.code,
      teacherId: row.teacher_id,
      room: row.room,
      maxStudents: row.max_students,
      schedule: row.schedule,
      semester: row.semester,
      description: row.description,
      createdAt: row.created_at, // return as string
      // Add teacher information
      first_name: row.first_name,
      last_name: row.last_name
    })) as Class[];
  }

  async getTeacherByUserId(userId: number): Promise<User | undefined> {
    const [rows] = await connection.query(`
      SELECT * FROM users 
      WHERE id = ? AND role = 'teacher'
    `, [userId]);
    const users = rows as User[];
    return users.length > 0 ? users[0] : undefined;
  }

  async createConsultationSlots(teacherId: number, startTime: string, endTime: string): Promise<ConsultationSlot[]> {
    const slots: Omit<ConsultationSlot, 'id'>[] = [];
    let current = new Date(startTime);
    const end = new Date(endTime);
    
    while (current < end) {
      const slotEnd = new Date(current.getTime() + 30 * 60000);
      
      if (slotEnd <= end) {
        // For DATETIME columns, we should keep the full datetime format
        // No need to format as time only since the database expects DATETIME
        const formatMySQLDateTime = (date: Date): string => {
          return date.toISOString().slice(0, 19).replace('T', ' ');
        };
        
        slots.push({
          teacherId,
          startTime: formatMySQLDateTime(current),
          endTime: formatMySQLDateTime(slotEnd),
          status: 'available',
          isActive: true
        });
      }
      
      current = slotEnd;
    }

    if (slots.length === 0) {
      return [];
    }

    const [result] = await connection.query(
      'INSERT INTO consultation_slots (teacher_id, start_time, end_time, status, is_active) VALUES ?',
      [slots.map(slot => [slot.teacherId, slot.startTime, slot.endTime, slot.status, slot.isActive ? 1 : 0])]
    ) as [ResultSetHeader, any];

    // Return the inserted slots directly instead of querying them back
    // This avoids issues with date comparison
    const insertedSlots = slots.map((slot, index) => ({
      id: result.insertId + index,
      teacherId: slot.teacherId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slot.status
    }));

    return insertedSlots as ConsultationSlot[];
  }

  async getConsultationSlots(teacherId: number, startTime: string, endTime: string): Promise<ConsultationSlot[]> {
    try {
      // For DATETIME columns, we can use proper date comparison
      const [rows] = await connection.query(
        `SELECT 
          id,
          teacher_id as teacherId,
          start_time as startTime,
          end_time as endTime,
          status
        FROM consultation_slots 
        WHERE teacher_id = ? AND start_time >= ? AND end_time <= ?`,
        [teacherId, startTime, endTime]
      ) as [ConsultationSlot[], any];

      return rows;
    } catch (error) {
      console.error('Error fetching consultation slots:', error);
      throw error;
    }
  }

  async createBooking(slotId: number, studentId: number, purpose: string, notes?: string): Promise<Booking> {
    const [result] = await connection.query(
      'INSERT INTO bookings (slot_id, student_id, status, purpose, teacher_notes) VALUES (?, ?, ?, ?, ?)',
      [slotId, studentId, 'pending', purpose, notes || null]
    ) as [ResultSetHeader, any];

    await connection.query(
      'UPDATE consultation_slots SET status = ? WHERE id = ?',
      ['pending_approval', slotId]
    );

    const [rows] = await connection.query(
      'SELECT * FROM bookings WHERE id = ?',
      [result.insertId]
    ) as [Booking[], any];

    return rows[0];
  }

  async updateBookingStatus(bookingId: number, status: 'approved' | 'rejected', teacherNotes?: string): Promise<Booking> {
    const [bookingRows] = await connection.query(
      'SELECT * FROM bookings WHERE id = ?',
      [bookingId]
    ) as [any[], any];

    if (!bookingRows || bookingRows.length === 0) {
      throw new Error('Booking not found');
    }

    const booking = bookingRows[0];
    console.log('Booking data:', booking);
    console.log('Booking slotId:', booking.slotId);

    // Access the slot_id directly since that's what the database returns
    const slotId = booking.slot_id;
    console.log('Using slotId:', slotId);

    if (status === 'approved') {
      // Create consultation record
      console.log('Querying for slot with ID:', slotId);
      const [slotRows] = await connection.query(
        'SELECT * FROM consultation_slots WHERE id = ?',
        [slotId]
      ) as [any[], any];

      console.log('Slot rows:', slotRows);
      console.log('Slot rows length:', slotRows ? slotRows.length : 'undefined');

      if (!slotRows || slotRows.length === 0) {
        // Let's also try querying all slots to see what's available
        const [allSlots] = await connection.query('SELECT * FROM consultation_slots') as [any[], any];
        console.log('All slots in database:', allSlots);
        throw new Error('Consultation slot not found');
      }

      const slot = slotRows[0];
      console.log('Slot data:', slot);

      // Access properties directly since that's what the database returns
      const teacherId = slot.teacher_id;
      console.log('Using teacherId:', teacherId);

      const consultation = await this.createConsultation({
        teacherId: teacherId,
        studentId: booking.student_id,
        dateTime: new Date(slot.start_time), // Convert to Date object
        duration: 30,
        purpose: booking.purpose,
        status: "approved",
        bookingId: bookingId  // Add the bookingId to link the consultation to the booking
      });

      // Update booking with consultation ID and teacher notes
      await connection.query(
        'UPDATE bookings SET consultation_id = ?, status = ?, teacher_notes = ? WHERE id = ?',
        [consultation.id, status, teacherNotes || null, bookingId]
      );

      // Update slot status
      await connection.query(
        'UPDATE consultation_slots SET status = ? WHERE id = ?',
        ['booked', slotId]
      );
    } else {
      // Update booking status and teacher notes
      await connection.query(
        'UPDATE bookings SET status = ?, teacher_notes = ? WHERE id = ?',
        [status, teacherNotes || null, bookingId]
      );

      // Reset slot status
      await connection.query(
        'UPDATE consultation_slots SET status = ? WHERE id = ?',
        ['available', slotId]
      );
    }

    const [rows] = await connection.query(
      'SELECT * FROM bookings WHERE id = ?',
      [bookingId]
    ) as [Booking[], any];

    return rows[0];
  }
}

// Switch to database-backed storage
export const storage = new DbStorage();
// export const storage = new MemStorage(); // (for mock/testing)



