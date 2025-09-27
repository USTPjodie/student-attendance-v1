"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.DbStorage = void 0;
const db_1 = require("./db");
class DbStorage {
    // User operations
    async getUser(id) {
        // Drizzle ORM query
        return await db_1.db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, id) });
    }
    async getUserByEmail(email) {
        // Drizzle ORM query
        return await db_1.db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, email) });
    }
    async createUser(user) {
        const result = await db_1.connection.query('INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)', [user.email, user.password, user.firstName, user.lastName, user.role]);
        // @ts-ignore
        return this.getUser(result[0].insertId);
    }
    // Class operations
    async getClasses() {
        const [rows] = await db_1.connection.query('SELECT * FROM classes ORDER BY created_at DESC');
        return rows;
    }
    async getClassesByTeacher(teacherId) {
        const [rows] = await db_1.connection.query('SELECT * FROM classes WHERE teacher_id = ? ORDER BY created_at DESC', [teacherId]);
        return rows;
    }
    async getClass(id) {
        const [rows] = await db_1.connection.query('SELECT * FROM classes WHERE id = ?', [id]);
        const classes = rows;
        return classes.length > 0 ? classes[0] : undefined;
    }
    async createClass(classData) {
        const result = await db_1.connection.query('INSERT INTO classes (name, code, teacher_id, room, max_students, schedule, semester, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [classData.name, classData.code, classData.teacherId, classData.room, classData.maxStudents, classData.schedule, classData.semester, classData.description]);
        // @ts-ignore
        return this.getClass(result[0].insertId);
    }
    async updateClass(id, updates) {
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
            await db_1.connection.query(`UPDATE classes SET ${setParts.join(', ')} WHERE id = ?`, values);
        }
        return this.getClass(id);
    }
    async deleteClass(id) {
        await db_1.connection.query('DELETE FROM classes WHERE id = ?', [id]);
    }
    // Student operations
    async getStudents() {
        const [rows] = await db_1.connection.query('SELECT * FROM students');
        return rows;
    }
    async getStudent(id) {
        const [rows] = await db_1.connection.query('SELECT * FROM students WHERE id = ?', [id]);
        const students = rows;
        return students.length > 0 ? students[0] : undefined;
    }
    async getStudentByUserId(userId) {
        const [rows] = await db_1.connection.query('SELECT * FROM students WHERE user_id = ?', [userId]);
        const students = rows;
        return students.length > 0 ? students[0] : undefined;
    }
    async createStudent(student) {
        const result = await db_1.connection.query('INSERT INTO students (user_id, student_id, year, program, gpa) VALUES (?, ?, ?, ?, ?)', [student.userId, student.studentId, student.year, student.program, student.gpa]);
        // @ts-ignore
        return this.getStudent(result[0].insertId);
    }
    async getStudentsByClass(classId) {
        const [rows] = await db_1.connection.query(`
      SELECT s.* FROM students s
      JOIN class_enrollments ce ON s.id = ce.student_id
      WHERE ce.class_id = ?
    `, [classId]);
        return rows;
    }
    // Attendance operations
    async getAttendanceRecords(classId, date) {
        let query = 'SELECT * FROM attendance_records WHERE class_id = ?';
        const params = [classId];
        if (date) {
            query += ' AND DATE(date) = ?';
            params.push(date.toISOString().split('T')[0]);
        }
        query += ' ORDER BY date DESC';
        const [rows] = await db_1.connection.query(query, params);
        return rows;
    }
    async markAttendance(record) {
        const result = await db_1.connection.query('INSERT INTO attendance_records (class_id, student_id, date, status, marked_by) VALUES (?, ?, ?, ?, ?)', [record.classId, record.studentId, record.date, record.status, record.markedBy]);
        // @ts-ignore
        const [rows] = await db_1.connection.query('SELECT * FROM attendance_records WHERE id = ?', [result[0].insertId]);
        return rows[0];
    }
    async updateAttendance(id, status) {
        await db_1.connection.query('UPDATE attendance_records SET status = ? WHERE id = ?', [status, id]);
        const [rows] = await db_1.connection.query('SELECT * FROM attendance_records WHERE id = ?', [id]);
        return rows[0];
    }
    async getAttendanceStats(studentId) {
        const [rows] = await db_1.connection.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
      FROM attendance_records
      WHERE student_id = ?
    `, [studentId]);
        return rows[0];
    }
    // Consultation operations
    async getConsultations() {
        const [rows] = await db_1.connection.query(`
      SELECT c.*,
             CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
             u.first_name as teacher_first_name,
             u.last_name as teacher_last_name,
             DATE_FORMAT(c.date_time, '%Y-%m-%dT%H:%i:%s') as date_time
      FROM consultations c
      JOIN users u ON c.teacher_id = u.id
      ORDER BY c.date_time DESC
    `);
        return rows;
    }
    async getConsultationsByTeacher(teacherId) {
        const [rows] = await db_1.connection.query(`
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
        return rows.map(row => {
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
            };
        });
    }
    async getConsultationsByStudent(studentId) {
        const [rows] = await db_1.connection.query(`
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
        return rows.map(row => ({
            ...row,
            teacher: {
                firstName: row.teacher_first_name,
                lastName: row.teacher_last_name
            },
            dateTime: row.date_time, // Ensure dateTime is a string
            createdAt: row.created_at // Ensure createdAt is a string
        }));
    }
    async createConsultation(consultation) {
        try {
            console.log('Creating consultation with data:', consultation);
            // Format the date for MySQL
            const formattedDateTime = new Date(consultation.dateTime).toISOString().slice(0, 19).replace('T', ' ');
            const [result] = await db_1.connection.query('INSERT INTO consultations (teacher_id, student_id, date_time, duration, purpose, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)', [consultation.teacherId, consultation.studentId, formattedDateTime, consultation.duration, consultation.purpose, consultation.status, consultation.notes || null]);
            // Get the created consultation with teacher information
            const [rows] = await db_1.connection.query(`
        SELECT c.*,
               u.first_name as teacher_first_name,
               u.last_name as teacher_last_name,
               DATE_FORMAT(c.date_time, '%Y-%m-%dT%H:%i:%s') as date_time
        FROM consultations c
        JOIN users u ON c.teacher_id = u.id
        WHERE c.id = ?
      `, [result.insertId]);
            // Transform the row to match the expected format
            const row = rows[0];
            return {
                ...row,
                teacher: {
                    firstName: row.teacher_first_name,
                    lastName: row.teacher_last_name
                }
            };
        }
        catch (error) {
            console.error('Error creating consultation:', error);
            throw error;
        }
    }
    async updateConsultation(id, updates) {
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
            await db_1.connection.query(`UPDATE consultations SET ${setParts.join(', ')} WHERE id = ?`, values);
        }
        // If the consultation is being approved, update the teacher's availability
        if (updates.status === 'approved') {
            const [consultation] = await db_1.connection.query('SELECT date_time, duration FROM consultations WHERE id = ?', [id]);
            if (consultation.length > 0) {
                const { date_time, duration } = consultation[0];
                const startTime = new Date(date_time);
                const endTime = new Date(startTime.getTime() + duration * 60000); // Convert duration to milliseconds
                // Insert the booked time slot into teacher_availability
                await db_1.connection.query('INSERT INTO teacher_availability (teacher_id, day, start_time, end_time) VALUES (?, ?, ?, ?)', [
                    updates.teacherId,
                    startTime.toLocaleDateString('en-US', { weekday: 'long' }),
                    startTime.toTimeString().slice(0, 8),
                    endTime.toTimeString().slice(0, 8)
                ]);
            }
        }
        // Get the updated consultation with teacher information
        const [rows] = await db_1.connection.query(`
      SELECT c.*,
             u.first_name as teacher_first_name,
             u.last_name as teacher_last_name,
             DATE_FORMAT(c.date_time, '%Y-%m-%dT%H:%i:%s') as date_time
      FROM consultations c
      JOIN users u ON c.teacher_id = u.id
      WHERE c.id = ?
    `, [id]);
        // Transform the row to match the expected format
        const row = rows[0];
        return {
            ...row,
            teacher: {
                firstName: row.teacher_first_name,
                lastName: row.teacher_last_name
            }
        };
    }
    // Booking operations
    async getBookingsByTeacher(teacherId) {
        const [rows] = await db_1.connection.query(`
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
        return rows.map(row => ({
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
    async getBookingsByStudent(studentId) {
        const [rows] = await db_1.connection.query(`
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
        return rows.map(row => ({
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
    async getGradesByStudent(studentId) {
        const [rows] = await db_1.connection.query(`
      SELECT g.*, a.title as assignment_title, a.type as assignment_type, c.name as class_name
      FROM grades g
      JOIN assignments a ON g.assignment_id = a.id
      JOIN classes c ON a.class_id = c.id
      WHERE g.student_id = ?
      ORDER BY g.graded_at DESC
    `, [studentId]);
        return rows;
    }
    async getGradesByClass(classId) {
        const [rows] = await db_1.connection.query(`
      SELECT g.*, a.title as assignment_title, a.type as assignment_type,
             CONCAT(u.first_name, ' ', u.last_name) as student_name
      FROM grades g
      JOIN assignments a ON g.assignment_id = a.id
      JOIN students s ON g.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE a.class_id = ?
      ORDER BY g.graded_at DESC
    `, [classId]);
        return rows;
    }
    async getTeacherAvailability(teacherId) {
        const [rows] = await db_1.connection.query(`SELECT 
        day,
        start_time as startTime,
        end_time as endTime
      FROM teacher_availability 
      WHERE teacher_id = ?
      ORDER BY FIELD(day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')`, [teacherId]);
        return rows;
    }
    async updateTeacherAvailability(teacherId, timeSlots) {
        try {
            await db_1.connection.query('START TRANSACTION');
            // Delete existing availability
            await db_1.connection.query('DELETE FROM teacher_availability WHERE teacher_id = ?', [teacherId]);
            // Insert new availability
            if (timeSlots.length > 0) {
                const values = timeSlots.map(slot => [
                    teacherId,
                    slot.day,
                    slot.startTime,
                    slot.endTime
                ]);
                await db_1.connection.query('INSERT INTO teacher_availability (teacher_id, day, start_time, end_time) VALUES ?', [values]);
            }
            await db_1.connection.query('COMMIT');
            return this.getTeacherAvailability(teacherId);
        }
        catch (error) {
            await db_1.connection.query('ROLLBACK');
            throw error;
        }
    }
    async getAvailableTimeSlots(teacherId, date) {
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
        const formattedDate = date.toISOString().split('T')[0];
        // Get teacher's availability for the day
        const [availabilityRows] = await db_1.connection.query('SELECT start_time, end_time FROM teacher_availability WHERE teacher_id = ? AND day = ?', [teacherId, dayOfWeek]);
        if (!availabilityRows || availabilityRows.length === 0) {
            return [];
        }
        // Get booked time slots for the day
        const bookedSlots = await this.getBookedTimeSlots(teacherId, date);
        // Generate available time slots
        const availableSlots = [];
        for (const availability of availabilityRows) {
            const [startHour, startMinute] = availability.start_time.split(':').map(Number);
            const [endHour, endMinute] = availability.end_time.split(':').map(Number);
            let currentTime = new Date(date);
            currentTime.setHours(startHour, startMinute, 0, 0);
            const endTime = new Date(date);
            endTime.setHours(endHour, endMinute, 0, 0);
            while (currentTime < endTime) {
                const slotEndTime = new Date(currentTime.getTime() + 30 * 60000); // 30 minutes
                if (slotEndTime <= endTime) {
                    const slot = {
                        day: dayOfWeek,
                        startTime: currentTime.toTimeString().slice(0, 8),
                        endTime: slotEndTime.toTimeString().slice(0, 8)
                    };
                    // Check if this slot overlaps with any booked slots
                    const isBooked = bookedSlots.some(booked => {
                        const bookedStart = new Date(`${formattedDate}T${booked.startTime}`);
                        const bookedEnd = new Date(`${formattedDate}T${booked.endTime}`);
                        return ((currentTime >= bookedStart && currentTime < bookedEnd) ||
                            (slotEndTime > bookedStart && slotEndTime <= bookedEnd) ||
                            (currentTime <= bookedStart && slotEndTime >= bookedEnd));
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
    async getBookedTimeSlots(teacherId, date) {
        const formattedDate = date.toISOString().split('T')[0];
        const [rows] = await db_1.connection.query(`
      SELECT 
        DATE_FORMAT(date_time, '%W') as day,
        DATE_FORMAT(date_time, '%H:%i:%s') as startTime,
        DATE_FORMAT(DATE_ADD(date_time, INTERVAL duration MINUTE), '%H:%i:%s') as endTime
      FROM consultations 
      WHERE teacher_id = ? 
      AND DATE(date_time) = ?
      AND status = 'approved'
    `, [teacherId, formattedDate]);
        return rows.map(row => ({
            day: row.day,
            startTime: row.startTime,
            endTime: row.endTime
        }));
    }
    // Get all teachers
    async getTeachers() {
        const [rows] = await db_1.connection.query('SELECT id, email, first_name, last_name FROM users WHERE role = "teacher"');
        return rows;
    }
    async getClassesByStudent(studentId) {
        const [rows] = await db_1.connection.query(`
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
        return rows.map(row => ({
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
        }));
    }
    async getTeacherByUserId(userId) {
        const [rows] = await db_1.connection.query(`
      SELECT * FROM users 
      WHERE id = ? AND role = 'teacher'
    `, [userId]);
        const users = rows;
        return users.length > 0 ? users[0] : undefined;
    }
    async createConsultationSlots(teacherId, startTime, endTime) {
        const slots = [];
        let current = new Date(startTime);
        const end = new Date(endTime);
        while (current < end) {
            const slotEnd = new Date(current.getTime() + 30 * 60000);
            if (slotEnd <= end) {
                // For DATETIME columns, we should keep the full datetime format
                // No need to format as time only since the database expects DATETIME
                const formatMySQLDateTime = (date) => {
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
        const [result] = await db_1.connection.query('INSERT INTO consultation_slots (teacher_id, start_time, end_time, status, is_active) VALUES ?', [slots.map(slot => [slot.teacherId, slot.startTime, slot.endTime, slot.status, slot.isActive ? 1 : 0])]);
        // Return the inserted slots directly instead of querying them back
        // This avoids issues with date comparison
        const insertedSlots = slots.map((slot, index) => ({
            id: result.insertId + index,
            teacherId: slot.teacherId,
            startTime: slot.startTime,
            endTime: slot.endTime,
            status: slot.status
        }));
        return insertedSlots;
    }
    async getConsultationSlots(teacherId, startTime, endTime) {
        try {
            // For DATETIME columns, we can use proper date comparison
            const [rows] = await db_1.connection.query(`SELECT 
          id,
          teacher_id as teacherId,
          start_time as startTime,
          end_time as endTime,
          status
        FROM consultation_slots 
        WHERE teacher_id = ? AND start_time >= ? AND end_time <= ?`, [teacherId, startTime, endTime]);
            return rows;
        }
        catch (error) {
            console.error('Error fetching consultation slots:', error);
            throw error;
        }
    }
    async createBooking(slotId, studentId, purpose, notes) {
        const [result] = await db_1.connection.query('INSERT INTO bookings (slot_id, student_id, status, purpose, teacher_notes) VALUES (?, ?, ?, ?, ?)', [slotId, studentId, 'pending', purpose, notes || null]);
        await db_1.connection.query('UPDATE consultation_slots SET status = ? WHERE id = ?', ['pending_approval', slotId]);
        const [rows] = await db_1.connection.query('SELECT * FROM bookings WHERE id = ?', [result.insertId]);
        return rows[0];
    }
    async updateBookingStatus(bookingId, status, teacherNotes) {
        const [bookingRows] = await db_1.connection.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
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
            const [slotRows] = await db_1.connection.query('SELECT * FROM consultation_slots WHERE id = ?', [slotId]);
            console.log('Slot rows:', slotRows);
            console.log('Slot rows length:', slotRows ? slotRows.length : 'undefined');
            if (!slotRows || slotRows.length === 0) {
                // Let's also try querying all slots to see what's available
                const [allSlots] = await db_1.connection.query('SELECT * FROM consultation_slots');
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
                bookingId: bookingId // Add the bookingId to link the consultation to the booking
            });
            // Update booking with consultation ID and teacher notes
            await db_1.connection.query('UPDATE bookings SET consultation_id = ?, status = ?, teacher_notes = ? WHERE id = ?', [consultation.id, status, teacherNotes || null, bookingId]);
            // Update slot status
            await db_1.connection.query('UPDATE consultation_slots SET status = ? WHERE id = ?', ['booked', slotId]);
        }
        else {
            // Update booking status and teacher notes
            await db_1.connection.query('UPDATE bookings SET status = ?, teacher_notes = ? WHERE id = ?', [status, teacherNotes || null, bookingId]);
            // Reset slot status
            await db_1.connection.query('UPDATE consultation_slots SET status = ? WHERE id = ?', ['available', slotId]);
        }
        const [rows] = await db_1.connection.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
        return rows[0];
    }
}
exports.DbStorage = DbStorage;
// Switch to database-backed storage
exports.storage = new DbStorage();
// export const storage = new MemStorage(); // (for mock/testing)
