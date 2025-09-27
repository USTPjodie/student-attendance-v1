-- Insert teachers
INSERT INTO users (email, password, first_name, last_name, role) VALUES
('prof.smith@ustp.edu.ph', '$2b$10$your_hashed_password', 'John', 'Smith', 'teacher'),
('maria.garcia@ustp.edu.ph', '$2b$10$your_hashed_password', 'Maria', 'Garcia', 'teacher'),
('robert.chen@ustp.edu.ph', '$2b$10$your_hashed_password', 'Robert', 'Chen', 'teacher'),
('sarah.wilson@ustp.edu.ph', '$2b$10$your_hashed_password', 'Sarah', 'Wilson', 'teacher');

-- Insert students
INSERT INTO users (email, password, first_name, last_name, role) VALUES
('alice.doe@student.ustp.edu.ph', '$2b$10$your_hashed_password', 'Alice', 'Doe', 'student'),
('juan.delacruz@student.ustp.edu.ph', '$2b$10$your_hashed_password', 'Juan', 'Dela Cruz', 'student'),
('maria.santos@student.ustp.edu.ph', '$2b$10$your_hashed_password', 'Maria', 'Santos', 'student'),
('james.wilson@student.ustp.edu.ph', '$2b$10$your_hashed_password', 'James', 'Wilson', 'student'),
('sophia.chen@student.ustp.edu.ph', '$2b$10$your_hashed_password', 'Sophia', 'Chen', 'student'),
('miguel.garcia@student.ustp.edu.ph', '$2b$10$your_hashed_password', 'Miguel', 'Garcia', 'student'),
('isabella.lee@student.ustp.edu.ph', '$2b$10$your_hashed_password', 'Isabella', 'Lee', 'student'),
('lucas.martinez@student.ustp.edu.ph', '$2b$10$your_hashed_password', 'Lucas', 'Martinez', 'student'),
('emma.tan@student.ustp.edu.ph', '$2b$10$your_hashed_password', 'Emma', 'Tan', 'student');

-- Insert student profiles
INSERT INTO students (user_id, student_id, year, program, gpa) VALUES
(5, '2023-0001', '3rd Year', 'Computer Science', 3.75),
(6, '2023-0002', '2nd Year', 'Information Technology', 3.50),
(7, '2023-0003', '4th Year', 'Electronics Engineering', 3.80),
(8, '2023-0004', '1st Year', 'Computer Science', 3.20),
(9, '2023-0005', '3rd Year', 'Information Technology', 3.90),
(10, '2023-0006', '2nd Year', 'Electronics Engineering', 3.60),
(11, '2023-0007', '4th Year', 'Computer Science', 3.85),
(12, '2023-0008', '1st Year', 'Information Technology', 3.40),
(13, '2023-0009', '3rd Year', 'Electronics Engineering', 3.70);

-- Insert classes
INSERT INTO classes (name, code, teacher_id, room, max_students, schedule, semester, description) VALUES
('Data Structures and Algorithms', 'CS-201', 1, 'Room 301', 35, 'MWF 9:00-10:00 AM', '1st Semester 2023-2024', 'Introduction to data structures and algorithms'),
('Database Management Systems', 'IT-301', 2, 'Room 205', 30, 'TTH 10:30-12:00 PM', '1st Semester 2023-2024', 'Database design and management'),
('Digital Electronics', 'EE-202', 3, 'Room 102', 25, 'MWF 1:00-2:30 PM', '1st Semester 2023-2024', 'Fundamentals of digital electronics'),
('Web Development', 'CS-305', 4, 'Computer Lab 1', 20, 'TTH 2:00-3:30 PM', '1st Semester 2023-2024', 'Modern web development techniques');

-- Insert class enrollments
INSERT INTO class_enrollments (class_id, student_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
(2, 3), (2, 4), (2, 6), (2, 7), (2, 8),
(3, 1), (3, 5), (3, 6), (3, 9), (3, 7),
(4, 2), (4, 4), (4, 8), (4, 9), (4, 1);

-- Insert sample attendance records
INSERT INTO attendance_records (class_id, student_id, date, status, marked_by) VALUES
(1, 1, '2023-09-01 09:00:00', 'present', 1),
(1, 2, '2023-09-01 09:00:00', 'absent', 1),
(1, 3, '2023-09-01 09:00:00', 'late', 1),
(1, 4, '2023-09-01 09:00:00', 'present', 1),
(1, 5, '2023-09-01 09:00:00', 'present', 1);

-- Insert teacher availability
INSERT INTO teacher_availability (teacher_id, day, start_time, end_time) VALUES
(1, 'Monday', '08:00:00', '12:00:00'),
(1, 'Wednesday', '08:00:00', '12:00:00'),
(1, 'Friday', '08:00:00', '10:00:00'),
(2, 'Tuesday', '10:00:00', '14:00:00'),
(2, 'Thursday', '10:00:00', '14:00:00'),
(3, 'Monday', '13:00:00', '17:00:00'),
(3, 'Wednesday', '13:00:00', '17:00:00'),
(4, 'Tuesday', '14:00:00', '18:00:00'),
(4, 'Thursday', '14:00:00', '18:00:00');