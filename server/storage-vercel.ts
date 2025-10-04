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
import { getDrizzleDb, getDbConnection } from './db-vercel';
import { eq, sql, ne, and } from 'drizzle-orm';
import { ResultSetHeader } from 'mysql2';
import type { MySql2Database } from 'drizzle-orm/mysql2';

export interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

// For Vercel serverless, we need to create connections on demand
// and close them after each operation to prevent connection leaks

export class VercelStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const connection = await getDbConnection();
    try {
      const db: MySql2Database<typeof import("@shared/schema")> = (await getDrizzleDb()) as MySql2Database<typeof import("@shared/schema")>;
      return await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, id) });
    } finally {
      // Close connection in serverless environment
      await connection.end();
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const connection = await getDbConnection();
    try {
      const db: MySql2Database<typeof import("@shared/schema")> = (await getDrizzleDb()) as MySql2Database<typeof import("@shared/schema")>;
      return await db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, email) });
    } finally {
      await connection.end();
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    const connection = await getDbConnection();
    try {
      const result = await connection.query(
        'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
        [user.email, user.password, user.firstName, user.lastName, user.role]
      );
      // @ts-ignore
      const [rows] = await connection.query('SELECT * FROM users WHERE id = ?', [result[0].insertId]);
      return (rows as User[])[0];
    } finally {
      await connection.end();
    }
  }

  // Class operations
  async getClasses(): Promise<Class[]> {
    const connection = await getDbConnection();
    try {
      const [rows] = await connection.query('SELECT * FROM classes ORDER BY created_at DESC');
      return rows as Class[];
    } finally {
      await connection.end();
    }
  }

  async getClassesByTeacher(teacherId: number): Promise<Class[]> {
    const connection = await getDbConnection();
    try {
      const [rows] = await connection.query('SELECT * FROM classes WHERE teacher_id = ? ORDER BY created_at DESC', [teacherId]);
      return rows as Class[];
    } finally {
      await connection.end();
    }
  }

  async getClass(id: number): Promise<Class | undefined> {
    const connection = await getDbConnection();
    try {
      const [rows] = await connection.query('SELECT * FROM classes WHERE id = ?', [id]);
      const classes = rows as Class[];
      return classes.length > 0 ? classes[0] : undefined;
    } finally {
      await connection.end();
    }
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const connection = await getDbConnection();
    try {
      const result = await connection.query(
        'INSERT INTO classes (name, code, teacher_id, room, max_students, schedule, semester, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [classData.name, classData.code, classData.teacherId, classData.room, classData.maxStudents, classData.schedule, classData.semester, classData.description]
      );
      // @ts-ignore
      const [rows] = await connection.query('SELECT * FROM classes WHERE id = ?', [result[0].insertId]);
      return (rows as Class[])[0];
    } finally {
      await connection.end();
    }
  }

  // Student operations
  async getStudents(): Promise<Student[]> {
    const connection = await getDbConnection();
    try {
      const [rows] = await connection.query('SELECT * FROM students');
      return rows as Student[];
    } finally {
      await connection.end();
    }
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const connection = await getDbConnection();
    try {
      const [rows] = await connection.query('SELECT * FROM students WHERE id = ?', [id]);
      const students = rows as Student[];
      return students.length > 0 ? students[0] : undefined;
    } finally {
      await connection.end();
    }
  }

  async getStudentByUserId(userId: number): Promise<Student | undefined> {
    const connection = await getDbConnection();
    try {
      const [rows] = await connection.query('SELECT * FROM students WHERE user_id = ?', [userId]);
      const students = rows as Student[];
      return students.length > 0 ? students[0] : undefined;
    } finally {
      await connection.end();
    }
  }

  // Consultation operations
  async getConsultationsByTeacher(teacherId: number): Promise<Consultation[]> {
    const connection = await getDbConnection();
    try {
      const [rows] = await connection.query(`
        SELECT c.*,
               u.first_name as teacher_first_name,
               u.last_name as teacher_last_name,
               DATE_FORMAT(c.date_time, '%Y-%m-%dT%H:%i:%s') as date_time
        FROM consultations c
        JOIN users u ON c.teacher_id = u.id
        WHERE c.teacher_id = ?
        ORDER BY c.date_time DESC
      `, [teacherId]);
      
      // Transform the rows to match the expected format
      return (rows as any[]).map(row => ({
        ...row,
        teacher: {
          firstName: row.teacher_first_name,
          lastName: row.teacher_last_name
        },
        dateTime: row.date_time,
        createdAt: row.created_at
      }));
    } finally {
      await connection.end();
    }
  }

  async getConsultationsByStudent(studentId: number): Promise<Consultation[]> {
    const connection = await getDbConnection();
    try {
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
        dateTime: row.date_time,
        createdAt: row.created_at
      }));
    } finally {
      await connection.end();
    }
  }

  // Teacher availability operations
  async getTeacherAvailability(teacherId: number): Promise<TimeSlot[]> {
    const connection = await getDbConnection();
    try {
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
    } finally {
      await connection.end();
    }
  }

  // Get all teachers
  async getTeachers(): Promise<User[]> {
    const connection = await getDbConnection();
    try {
      const [rows] = await connection.query(
        'SELECT id, email, first_name, last_name FROM users WHERE role = "teacher"'
      );
      return rows as User[];
    } finally {
      await connection.end();
    }
  }

  // Get classes by student
  async getClassesByStudent(studentId: number): Promise<Class[]> {
    const connection = await getDbConnection();
    try {
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
        createdAt: row.created_at,
        // Add teacher information
        first_name: row.first_name,
        last_name: row.last_name
      })) as Class[];
    } finally {
      await connection.end();
    }
  }
}

// Export storage instance for Vercel
export const vercelStorage = new VercelStorage();