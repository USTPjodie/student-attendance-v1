-- Insert teachers
INSERT INTO users (email, password, first_name, last_name, role) VALUES
('john.smith@ustp.edu.ph', '$2b$10$your_hashed_password', 'John', 'Smith', 'teacher'),
('maria.garcia@ustp.edu.ph', '$2b$10$your_hashed_password', 'Maria', 'Garcia', 'teacher'),
('robert.chen@ustp.edu.ph', '$2b$10$your_hashed_password', 'Robert', 'Chen', 'teacher'),
('sarah.wilson@ustp.edu.ph', '$2b$10$your_hashed_password', 'Sarah', 'Wilson', 'teacher');

-- Insert students
INSERT INTO users (email, password, first_name, last_name, role) VALUES
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
(5, '2021-0001', '3rd Year', 'BS Computer Science', 3.75),
(6, '2021-0002', '3rd Year', 'BS Computer Science', 3.85),
(7, '2021-0003', '3rd Year', 'BS Computer Science', 3.65),
(8, '2021-0004', '3rd Year', 'BS Computer Science', 3.90),
(9, '2021-0005', '3rd Year', 'BS Computer Science', 3.70),
(10, '2021-0006', '3rd Year', 'BS Computer Science', 3.80),
(11, '2021-0007', '3rd Year', 'BS Computer Science', 3.95),
(12, '2021-0008', '3rd Year', 'BS Computer Science', 3.60);

-- Insert classes
INSERT INTO classes (name, code, teacher_id, room, max_students, schedule, semester, description) VALUES
('Programming Fundamentals', 'CS 101', 1, 'Room 301', 35, 'MWF 9:00-10:30 AM', '2024-1', 'Introduction to programming concepts and problem-solving'),
('Data Structures', 'CS 201', 2, 'Room 302', 35, 'TTh 1:00-2:30 PM', '2024-1', 'Study of fundamental data structures and algorithms'),
('Database Systems', 'CS 301', 3, 'Room 303', 35, 'MWF 2:00-3:30 PM', '2024-1', 'Introduction to database design and management'),
('Web Development', 'CS 401', 4, 'Room 304', 35, 'TTh 9:00-10:30 AM', '2024-1', 'Modern web development technologies and practices');

-- Enroll students in classes
INSERT INTO class_enrollments (class_id, student_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8),
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7), (2, 8),
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6), (3, 7), (3, 8),
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6), (4, 7), (4, 8);

-- Insert attendance records (last 30 days)
INSERT INTO attendance_records (class_id, student_id, date, status, marked_by) VALUES
(1, 1, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY), 'present', 1),
(1, 2, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY), 'present', 1),
(1, 3, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY), 'absent', 1),
(1, 4, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY), 'present', 1),
(1, 5, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY), 'present', 1),
(1, 6, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY), 'late', 1),
(1, 7, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY), 'present', 1),
(1, 8, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY), 'present', 1);

-- Insert assignments
INSERT INTO assignments (class_id, title, description, type, max_score, weight, due_date) VALUES
(1, 'Programming Assignment 1', 'Basic programming exercises', 'assignment', 100.00, 1.00, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 7 DAY)),
(1, 'Midterm Exam', 'Comprehensive exam covering all topics', 'exam', 100.00, 1.50, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 14 DAY)),
(2, 'Data Structures Project', 'Implementation of various data structures', 'project', 100.00, 1.50, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 10 DAY)),
(3, 'Database Design', 'ERD and normalization exercises', 'assignment', 100.00, 1.00, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 5 DAY));

-- Insert grades
INSERT INTO grades (assignment_id, student_id, score, letter_grade, comments) VALUES
(1, 1, 95.00, 'A', 'Excellent work!'),
(1, 2, 88.00, 'B+', 'Good job'),
(1, 3, 92.00, 'A-', 'Well done'),
(1, 4, 85.00, 'B', 'Good effort'),
(1, 5, 90.00, 'A-', 'Very good'),
(1, 6, 87.00, 'B+', 'Good work'),
(1, 7, 94.00, 'A', 'Excellent'),
(1, 8, 86.00, 'B', 'Good job');

-- Insert consultations
INSERT INTO consultations (teacher_id, student_id, date_time, duration, purpose, status) VALUES
(1, 1, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 2 DAY), 60, 'Discussion about midterm grades', 'pending'),
(2, 2, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 3 DAY), 60, 'Help with data structures project', 'approved'),
(3, 3, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 DAY), 60, 'Database design consultation', 'completed'),
(4, 4, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 4 DAY), 60, 'Web development project discussion', 'pending');

-- Insert teacher availability
INSERT INTO teacher_availability (teacher_id, day, start_time, end_time) VALUES
(1, 'Monday', '09:00:00', '17:00:00'),
(1, 'Wednesday', '09:00:00', '17:00:00'),
(1, 'Friday', '09:00:00', '17:00:00'),
(2, 'Tuesday', '09:00:00', '17:00:00'),
(2, 'Thursday', '09:00:00', '17:00:00'),
(3, 'Monday', '09:00:00', '17:00:00'),
(3, 'Wednesday', '09:00:00', '17:00:00'),
(3, 'Friday', '09:00:00', '17:00:00'),
(4, 'Tuesday', '09:00:00', '17:00:00'),
(4, 'Thursday', '09:00:00', '17:00:00'); 