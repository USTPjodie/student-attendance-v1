-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS student_attendance;
USE student_attendance;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    teacher_id INT NOT NULL,
    room VARCHAR(50),
    max_students INT DEFAULT 35,
    schedule VARCHAR(255),
    semester VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    student_id VARCHAR(50) NOT NULL UNIQUE,
    year VARCHAR(50) NOT NULL,
    program VARCHAR(255) NOT NULL,
    gpa DECIMAL(3,2) DEFAULT 0.00,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Class enrollments table
CREATE TABLE IF NOT EXISTS class_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    student_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Attendance records table
CREATE TABLE IF NOT EXISTS attendance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    student_id INT NOT NULL,
    date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL,
    marked_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (marked_by) REFERENCES users(id)
);

-- Teacher availability table
CREATE TABLE IF NOT EXISTS teacher_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    day VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- Consultation slots table
CREATE TABLE IF NOT EXISTS consultation_slots (
    id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status ENUM('available', 'booked', 'pending_approval') NOT NULL DEFAULT 'available',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slot_id INT NOT NULL,
    student_id INT NOT NULL,
    consultation_id INT,
    status VARCHAR(20) NOT NULL,
    purpose VARCHAR(1000),
    teacher_notes VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (slot_id) REFERENCES consultation_slots(id),
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Consultations table
CREATE TABLE IF NOT EXISTS consultations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT,
    teacher_id INT NOT NULL,
    student_id INT NOT NULL,
    date_time TIMESTAMP NOT NULL,
    duration INT DEFAULT 60,
    purpose TEXT,
    status ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (teacher_id) REFERENCES users(id),
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    max_score DECIMAL(5,2) NOT NULL,
    weight DECIMAL(3,2) DEFAULT 1.00,
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- Grades table
CREATE TABLE IF NOT EXISTS grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    letter_grade VARCHAR(2),
    comments TEXT,
    graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id),
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Add indexes for performance
CREATE INDEX idx_slots_teacher ON consultation_slots(teacher_id);
CREATE INDEX idx_slots_start ON consultation_slots(start_time);
CREATE INDEX idx_bookings_student ON bookings(student_id);
CREATE INDEX idx_bookings_status ON bookings(status);

SHOW TABLES;