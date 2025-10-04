import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

// Database connection configuration - using 'db' as hostname since we're in the Docker network
const connectionConfig = {
  host: 'db',  // Changed from 'localhost' to 'db' for Docker networking
  port: 3306,
  user: 'appuser',
  password: 'apppassword',
  database: 'student_attendance',
};

async function reseedDatabase() {
  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection(connectionConfig);
    console.log('Connected to database successfully');

    // Hash the password
    const password = await bcrypt.hash('password123', 10);
    console.log('Generated password hash:', password);

    // Clear existing data
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    await connection.query('TRUNCATE TABLE users;');
    await connection.query('TRUNCATE TABLE students;');
    await connection.query('TRUNCATE TABLE classes;');
    await connection.query('TRUNCATE TABLE class_enrollments;');
    await connection.query('TRUNCATE TABLE attendance_records;');
    await connection.query('TRUNCATE TABLE teacher_availability;');
    await connection.query('TRUNCATE TABLE consultation_slots;');
    await connection.query('TRUNCATE TABLE bookings;');
    await connection.query('TRUNCATE TABLE consultations;');
    await connection.query('TRUNCATE TABLE assignments;');
    await connection.query('TRUNCATE TABLE grades;');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');

    // Insert teachers
    await connection.query(
      'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
      ['prof.smith@ustp.edu.ph', password, 'John', 'Smith', 'teacher']
    );
    
    await connection.query(
      'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
      ['maria.garcia@ustp.edu.ph', password, 'Maria', 'Garcia', 'teacher']
    );
    
    await connection.query(
      'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
      ['robert.chen@ustp.edu.ph', password, 'Robert', 'Chen', 'teacher']
    );
    
    await connection.query(
      'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
      ['sarah.wilson@ustp.edu.ph', password, 'Sarah', 'Wilson', 'teacher']
    );

    // Insert students
    await connection.query(
      'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
      ['alice.doe@student.ustp.edu.ph', password, 'Alice', 'Doe', 'student']
    );
    
    await connection.query(
      'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
      ['juan.delacruz@student.ustp.edu.ph', password, 'Juan', 'Dela Cruz', 'student']
    );
    
    await connection.query(
      'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
      ['maria.santos@student.ustp.edu.ph', password, 'Maria', 'Santos', 'student']
    );
    
    await connection.query(
      'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
      ['james.wilson@student.ustp.edu.ph', password, 'James', 'Wilson', 'student']
    );
    
    await connection.query(
      'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
      ['sophia.chen@student.ustp.edu.ph', password, 'Sophia', 'Chen', 'student']
    );
    
    await connection.query(
      'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
      ['miguel.garcia@student.ustp.edu.ph', password, 'Miguel', 'Garcia', 'student']
    );
    
    await connection.query(
      'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
      ['isabella.lee@student.ustp.edu.ph', password, 'Isabella', 'Lee', 'student']
    );
    
    await connection.query(
      'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
      ['lucas.martinez@student.ustp.edu.ph', password, 'Lucas', 'Martinez', 'student']
    );
    
    await connection.query(
      'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
      ['emma.tan@student.ustp.edu.ph', password, 'Emma', 'Tan', 'student']
    );

    // Get user IDs for students
    const [users] = await connection.query('SELECT id, email, role FROM users');
    const studentUsers = users.filter(user => user.role === 'student');
    const teacherUsers = users.filter(user => user.role === 'teacher');
    
    // Insert student profiles
    const studentData = [
      { email: 'alice.doe@student.ustp.edu.ph', studentId: '2023-0001', year: '3rd Year', program: 'Computer Science', gpa: 3.75 },
      { email: 'juan.delacruz@student.ustp.edu.ph', studentId: '2023-0002', year: '2nd Year', program: 'Information Technology', gpa: 3.50 },
      { email: 'maria.santos@student.ustp.edu.ph', studentId: '2023-0003', year: '4th Year', program: 'Electronics Engineering', gpa: 3.80 },
      { email: 'james.wilson@student.ustp.edu.ph', studentId: '2023-0004', year: '1st Year', program: 'Computer Science', gpa: 3.20 },
      { email: 'sophia.chen@student.ustp.edu.ph', studentId: '2023-0005', year: '3rd Year', program: 'Information Technology', gpa: 3.90 },
      { email: 'miguel.garcia@student.ustp.edu.ph', studentId: '2023-0006', year: '2nd Year', program: 'Electronics Engineering', gpa: 3.60 },
      { email: 'isabella.lee@student.ustp.edu.ph', studentId: '2023-0007', year: '4th Year', program: 'Computer Science', gpa: 3.85 },
      { email: 'lucas.martinez@student.ustp.edu.ph', studentId: '2023-0008', year: '1st Year', program: 'Information Technology', gpa: 3.40 },
      { email: 'emma.tan@student.ustp.edu.ph', studentId: '2023-0009', year: '3rd Year', program: 'Electronics Engineering', gpa: 3.70 }
    ];
    
    // Store student IDs for enrollment
    const studentIds = {};
    
    for (const student of studentData) {
      const user = studentUsers.find(u => u.email === student.email);
      if (user) {
        const result = await connection.query(
          'INSERT INTO students (user_id, student_id, year, program, gpa) VALUES (?, ?, ?, ?, ?)',
          [user.id, student.studentId, student.year, student.program, student.gpa]
        );
        // Store the inserted student ID
        studentIds[student.email] = result[0].insertId;
      }
    }

    // Insert classes
    const classResults = [];
    const class1 = await connection.query(
      'INSERT INTO classes (name, code, teacher_id, room, max_students, schedule, semester, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['Data Structures and Algorithms', 'CS-201', 1, 'Room 301', 35, 'MWF 9:00-10:00 AM', '1st Semester 2023-2024', 'Introduction to data structures and algorithms']
    );
    classResults.push({ id: class1[0].insertId, name: 'Data Structures and Algorithms' });
    
    const class2 = await connection.query(
      'INSERT INTO classes (name, code, teacher_id, room, max_students, schedule, semester, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['Database Management Systems', 'IT-301', 2, 'Room 205', 30, 'TTH 10:30-12:00 PM', '1st Semester 2023-2024', 'Database design and management']
    );
    classResults.push({ id: class2[0].insertId, name: 'Database Management Systems' });
    
    const class3 = await connection.query(
      'INSERT INTO classes (name, code, teacher_id, room, max_students, schedule, semester, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['Digital Electronics', 'EE-202', 3, 'Room 102', 25, 'MWF 1:00-2:30 PM', '1st Semester 2023-2024', 'Fundamentals of digital electronics']
    );
    classResults.push({ id: class3[0].insertId, name: 'Digital Electronics' });
    
    const class4 = await connection.query(
      'INSERT INTO classes (name, code, teacher_id, room, max_students, schedule, semester, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['Web Development', 'CS-305', 4, 'Computer Lab 1', 20, 'TTH 2:00-3:30 PM', '1st Semester 2023-2024', 'Modern web development techniques']
    );
    classResults.push({ id: class4[0].insertId, name: 'Web Development' });

    // Insert class enrollments
    // Enroll students in classes (creating realistic enrollments)
    const enrollments = [
      // Data Structures and Algorithms (class_id: 1)
      { class_id: 1, student_id: studentIds['alice.doe@student.ustp.edu.ph'] },
      { class_id: 1, student_id: studentIds['juan.delacruz@student.ustp.edu.ph'] },
      { class_id: 1, student_id: studentIds['maria.santos@student.ustp.edu.ph'] },
      { class_id: 1, student_id: studentIds['james.wilson@student.ustp.edu.ph'] },
      { class_id: 1, student_id: studentIds['sophia.chen@student.ustp.edu.ph'] },
      
      // Database Management Systems (class_id: 2)
      { class_id: 2, student_id: studentIds['maria.santos@student.ustp.edu.ph'] },
      { class_id: 2, student_id: studentIds['james.wilson@student.ustp.edu.ph'] },
      { class_id: 2, student_id: studentIds['miguel.garcia@student.ustp.edu.ph'] },
      { class_id: 2, student_id: studentIds['isabella.lee@student.ustp.edu.ph'] },
      { class_id: 2, student_id: studentIds['lucas.martinez@student.ustp.edu.ph'] },
      
      // Digital Electronics (class_id: 3)
      { class_id: 3, student_id: studentIds['alice.doe@student.ustp.edu.ph'] },
      { class_id: 3, student_id: studentIds['sophia.chen@student.ustp.edu.ph'] },
      { class_id: 3, student_id: studentIds['miguel.garcia@student.ustp.edu.ph'] },
      { class_id: 3, student_id: studentIds['emma.tan@student.ustp.edu.ph'] },
      { class_id: 3, student_id: studentIds['isabella.lee@student.ustp.edu.ph'] },
      
      // Web Development (class_id: 4)
      { class_id: 4, student_id: studentIds['juan.delacruz@student.ustp.edu.ph'] },
      { class_id: 4, student_id: studentIds['james.wilson@student.ustp.edu.ph'] },
      { class_id: 4, student_id: studentIds['lucas.martinez@student.ustp.edu.ph'] },
      { class_id: 4, student_id: studentIds['emma.tan@student.ustp.edu.ph'] },
      { class_id: 4, student_id: studentIds['alice.doe@student.ustp.edu.ph'] }
    ];
    
    for (const enrollment of enrollments) {
      await connection.query(
        'INSERT INTO class_enrollments (class_id, student_id) VALUES (?, ?)',
        [enrollment.class_id, enrollment.student_id]
      );
    }

    // Insert sample attendance records
    const attendanceRecords = [
      { class_id: 1, student_id: studentIds['alice.doe@student.ustp.edu.ph'], date: '2023-09-01 09:00:00', status: 'present', marked_by: 1 },
      { class_id: 1, student_id: studentIds['juan.delacruz@student.ustp.edu.ph'], date: '2023-09-01 09:00:00', status: 'absent', marked_by: 1 },
      { class_id: 1, student_id: studentIds['maria.santos@student.ustp.edu.ph'], date: '2023-09-01 09:00:00', status: 'late', marked_by: 1 },
      { class_id: 1, student_id: studentIds['james.wilson@student.ustp.edu.ph'], date: '2023-09-01 09:00:00', status: 'present', marked_by: 1 },
      { class_id: 1, student_id: studentIds['sophia.chen@student.ustp.edu.ph'], date: '2023-09-01 09:00:00', status: 'present', marked_by: 1 }
    ];
    
    for (const record of attendanceRecords) {
      await connection.query(
        'INSERT INTO attendance_records (class_id, student_id, date, status, marked_by) VALUES (?, ?, ?, ?, ?)',
        [record.class_id, record.student_id, record.date, record.status, record.marked_by]
      );
    }

    // Insert teacher availability
    const availabilityRecords = [
      { teacher_id: 1, day: 'Monday', start_time: '08:00:00', end_time: '12:00:00' },
      { teacher_id: 1, day: 'Wednesday', start_time: '08:00:00', end_time: '12:00:00' },
      { teacher_id: 1, day: 'Friday', start_time: '08:00:00', end_time: '10:00:00' },
      { teacher_id: 2, day: 'Tuesday', start_time: '10:00:00', end_time: '14:00:00' },
      { teacher_id: 2, day: 'Thursday', start_time: '10:00:00', end_time: '14:00:00' },
      { teacher_id: 3, day: 'Monday', start_time: '13:00:00', end_time: '17:00:00' },
      { teacher_id: 3, day: 'Wednesday', start_time: '13:00:00', end_time: '17:00:00' },
      { teacher_id: 4, day: 'Tuesday', start_time: '14:00:00', end_time: '18:00:00' },
      { teacher_id: 4, day: 'Thursday', start_time: '14:00:00', end_time: '18:00:00' }
    ];
    
    for (const availability of availabilityRecords) {
      await connection.query(
        'INSERT INTO teacher_availability (teacher_id, day, start_time, end_time) VALUES (?, ?, ?, ?)',
        [availability.teacher_id, availability.day, availability.start_time, availability.end_time]
      );
    }

    console.log('Database reseeded successfully!');
    
    // Verify the data
    const [verifyUsers] = await connection.query('SELECT id, email, password, first_name, last_name, role FROM users WHERE email IN (?, ?)', [
      'prof.smith@ustp.edu.ph',
      'alice.doe@student.ustp.edu.ph'
    ]);
    
    console.log('Verified users:', verifyUsers);
    
    // Check counts
    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [studentCount] = await connection.query('SELECT COUNT(*) as count FROM students');
    const [classCount] = await connection.query('SELECT COUNT(*) as count FROM classes');
    const [enrollmentCount] = await connection.query('SELECT COUNT(*) as count FROM class_enrollments');
    const [attendanceCount] = await connection.query('SELECT COUNT(*) as count FROM attendance_records');
    
    console.log(`Database statistics:`);
    console.log(`- Users: ${userCount[0].count}`);
    console.log(`- Students: ${studentCount[0].count}`);
    console.log(`- Classes: ${classCount[0].count}`);
    console.log(`- Enrollments: ${enrollmentCount[0].count}`);
    console.log(`- Attendance records: ${attendanceCount[0].count}`);
    
    if (verifyUsers.length >= 2) {
      const teacher = verifyUsers.find(u => u.email === 'prof.smith@ustp.edu.ph');
      const student = verifyUsers.find(u => u.email === 'alice.doe@student.ustp.edu.ph');
      
      console.log('Teacher password hash:', teacher.password);
      console.log('Student password hash:', student.password);
      
      // Test password verification
      const teacherMatch = await bcrypt.compare('password123', teacher.password);
      const studentMatch = await bcrypt.compare('password123', student.password);
      
      console.log('Teacher password match:', teacherMatch);
      console.log('Student password match:', studentMatch);
      
      if (teacherMatch && studentMatch) {
        console.log('✅ Database reseeding completed successfully! Authentication should now work.');
      } else {
        console.log('❌ Password verification failed after reseeding.');
      }
    }
  } catch (error) {
    console.error('Error reseeding database:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

reseedDatabase();