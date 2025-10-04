import bcrypt from 'bcrypt';
import { pool } from './db';

export interface User {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface Student {
  id: number;
  userId: number;
  studentId: string;
  year: string;
  program: string;
  gpa: number;
}

export async function authenticateUser(email: string, password: string): Promise<{user: any} | null> {
  let connection;
  try {
    // Get a connection from the pool
    connection = await pool.getConnection();
    
    // Get user by email
    const [users] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (!users || (users as any[]).length === 0) {
      connection.release();
      return null;
    }
    
    const user = (users as any[])[0];
    
    // Compare password with hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      connection.release();
      return null;
    }
    
    // Get additional data based on role
    let userData: any = { 
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role
    };
    
    if (user.role === 'student') {
      const [students] = await connection.query(
        'SELECT * FROM students WHERE user_id = ?',
        [user.id]
      );
      
      if (students && (students as any[]).length > 0) {
        const student = (students as any[])[0];
        userData = { 
          ...userData, 
          student: {
            id: student.id,
            studentId: student.student_id,
            year: student.year,
            program: student.program,
            gpa: student.gpa
          }
        };
      }
    }
    
    connection.release();
    return { user: userData };
  } catch (error) {
    console.error('Authentication error:', error);
    if (connection) connection.release();
    throw error;
  }
}

export async function getUserById(id: number): Promise<{user: any} | null> {
  let connection;
  try {
    // Get a connection from the pool
    connection = await pool.getConnection();
    
    // Get user by id
    const [users] = await connection.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    
    if (!users || (users as any[]).length === 0) {
      connection.release();
      return null;
    }
    
    const user = (users as any[])[0];
    
    // Get additional data based on role
    let userData: any = { 
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role
    };
    
    if (user.role === 'student') {
      const [students] = await connection.query(
        'SELECT * FROM students WHERE user_id = ?',
        [user.id]
      );
      
      if (students && (students as any[]).length > 0) {
        const student = (students as any[])[0];
        userData = { 
          ...userData, 
          student: {
            id: student.id,
            studentId: student.student_id,
            year: student.year,
            program: student.program,
            gpa: student.gpa
          }
        };
      }
    }
    
    connection.release();
    return { user: userData };
  } catch (error) {
    console.error('Get user error:', error);
    if (connection) connection.release();
    throw error;
  }
}