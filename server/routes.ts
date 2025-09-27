import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertClassSchema, insertAttendanceSchema, insertConsultationSchema, type User, type Student } from "@shared/schema";
import bcrypt from 'bcrypt';
import { format } from 'date-fns';
import { connection } from "./db";

// Add type for user with student data
interface UserWithStudent extends User {
  student?: Student;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      // Remove role from the destructuring since we'll determine it from the database
      const { email, password } = req.body;
      
      // Get user by email - the role is stored in the database
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Compare password with hashed password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session with the role from the database
      (req as any).session.userId = user.id;
      (req as any).session.userRole = user.role;

      // Get additional data based on role
      let userData: UserWithStudent = { ...user };
      if (user.role === "student") {
        const student = await storage.getStudentByUserId(user.id);
        userData = { ...userData, student };
      }

      res.json({ user: userData });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    (req as any).session.destroy();
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      let userData: UserWithStudent = { ...user };
      if (user.role === "student") {
        const student = await storage.getStudentByUserId(user.id);
        userData = { ...userData, student };
      }

      res.json({ user: userData });
    } catch (error) {
      console.error("Auth check error:", error);
      res.status(500).json({ message: "Authentication check failed" });
    }
  });

  // Class routes
  app.get("/api/classes", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      const userRole = (req as any).session?.userRole;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      let classes;
      if (userRole === "teacher") {
        classes = await storage.getClassesByTeacher(userId);
      } else {
        classes = await storage.getClasses();
      }

      res.json(classes);
    } catch (error) {
      console.error("Get classes error:", error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  app.post("/api/classes", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const classData = insertClassSchema.parse({
        ...req.body,
        teacherId: userId,
      });

      const newClass = await storage.createClass(classData);
      res.status(201).json(newClass);
    } catch (error) {
      console.error("Create class error:", error);
      res.status(500).json({ message: "Failed to create class" });
    }
  });

  // Student routes
  app.get("/api/students", async (req, res) => {
    try {
      const { classId } = req.query;
      
      let students;
      if (classId) {
        students = await storage.getStudentsByClass(Number(classId));
      } else {
        students = await storage.getStudents();
      }

      // Get user details for each student
      const studentsWithUsers = await Promise.all(
        students.map(async (student) => {
          const user = await storage.getUser(student.userId);
          return { ...student, user };
        })
      );

      res.json(studentsWithUsers);
    } catch (error) {
      console.error("Get students error:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/student/classes", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const student = await storage.getStudentByUserId(userId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      const classes = await storage.getClassesByStudent(student.id);
      res.json(classes);
    } catch (error) {
      console.error("Get student classes error:", error);
      res.status(500).json({ message: "Failed to fetch student classes" });
    }
  });

  // Attendance routes
  app.get("/api/attendance", async (req, res) => {
    try {
      const { classId, date } = req.query;
      
      if (!classId) {
        return res.status(400).json({ message: "Class ID is required" });
      }

      const attendanceDate = date ? new Date(date as string) : undefined;
      const records = await storage.getAttendanceRecords(Number(classId), attendanceDate);
      
      res.json(records);
    } catch (error) {
      console.error("Get attendance error:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.post("/api/attendance", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const attendanceData = insertAttendanceSchema.parse({
        ...req.body,
        markedBy: userId,
        date: new Date(req.body.date),
      });

      const record = await storage.markAttendance(attendanceData);
      res.status(201).json(record);
    } catch (error) {
      console.error("Mark attendance error:", error);
      res.status(500).json({ message: "Failed to mark attendance" });
    }
  });

  app.get("/api/attendance/stats/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const stats = await storage.getAttendanceStats(Number(studentId));
      res.json(stats);
    } catch (error) {
      console.error("Get attendance stats error:", error);
      res.status(500).json({ message: "Failed to fetch attendance stats" });
    }
  });

  // Consultation routes
  app.get("/api/consultations", async (req, res) => {
    res.set("Cache-Control", "no-store"); // Prevent caching so new consultations always show up
    try {
      const userId = (req as any).session?.userId;
      const userRole = (req as any).session?.userRole;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      let consultations;
      if (userRole === "teacher") {
        // For teachers, get both consultations and pending bookings
        const teacherConsultations = await storage.getConsultationsByTeacher(userId);
        const pendingBookings = await storage.getBookingsByTeacher(userId);
        
        // Combine consultations and bookings into a single array
        consultations = [
          ...teacherConsultations,
          ...pendingBookings.map(booking => ({
            id: booking.id,
            teacherId: userId, // We know this is the teacher's ID
            studentId: booking.studentId,
            dateTime: new Date((booking as any).dateTime).toISOString(), // Convert to ISO string
            duration: 30, // Default duration for bookings
            purpose: booking.purpose,
            status: booking.status,
            notes: booking.teacherNotes || null,
            bookingId: booking.id, // Link to the booking
            createdAt: new Date(booking.createdAt).toISOString(), // Convert to ISO string
            student: (booking as any).student
          }))
        ];
      } else {
        // For students, get both consultations and their bookings
        const student = await storage.getStudentByUserId(userId);
        if (!student) {
          return res.status(404).json({ message: "Student not found" });
        }
        
        // For students, get both consultations and their bookings
        const studentConsultations = await storage.getConsultationsByStudent(student.id);
        const studentBookings = await storage.getBookingsByStudent(student.id);
        
        // Combine consultations and bookings into a single array
        // Filter out bookings that have already been converted to consultations
        // A booking is converted to a consultation when it has a consultation_id
        const convertedBookingIds = studentBookings
          .filter(booking => booking.consultationId !== null && booking.consultationId !== undefined)
          .map(booking => booking.id);
        const filteredBookings = studentBookings.filter(booking => !convertedBookingIds.includes(booking.id));
        
        consultations = [
          ...studentConsultations,
          ...filteredBookings.map(booking => ({
            id: `booking-${booking.id}`, // Prefix to ensure unique IDs
            teacherId: booking.teacherId, // Get teacher ID from the booking
            studentId: student.id,
            dateTime: booking.dateTime ? new Date(booking.dateTime).toISOString() : new Date(booking.createdAt).toISOString(), // Convert to ISO string
            duration: 30, // Default duration for bookings
            purpose: booking.purpose,
            status: booking.status,
            notes: booking.teacherNotes || null,
            bookingId: booking.id, // Link to the booking
            createdAt: new Date(booking.createdAt).toISOString(), // Convert to ISO string
            teacher: booking.teacher
          }))
        ];
      }

      res.json(consultations);
    } catch (error) {
      console.error("Get consultations error:", error);
      res.status(500).json({ message: "Failed to fetch consultations" });
    }
  });

  app.post("/api/consultations", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const student = await storage.getStudentByUserId(userId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      console.log('Received consultation request:', req.body);

      // Parse and validate the date
      const dateTime = new Date(req.body.dateTime);
      if (isNaN(dateTime.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      const consultationData = {
        ...req.body,
        dateTime,
        studentId: student.id,
        status: "pending",
      };

      console.log('Parsed consultation data:', consultationData);

      const consultation = await storage.createConsultation(consultationData);
      res.status(201).json(consultation);
    } catch (error) {
      console.error("Create consultation error:", error);
      if (error instanceof Error) {
        res.status(500).json({ message: `Failed to create consultation: ${error.message}` });
      } else {
        res.status(500).json({ message: "Failed to create consultation" });
      }
    }
  });

  app.patch("/api/consultations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (updates.dateTime) {
        updates.dateTime = new Date(updates.dateTime);
      }

      const consultation = await storage.updateConsultation(Number(id), updates);
      res.json(consultation);
    } catch (error) {
      console.error("Update consultation error:", error);
      res.status(500).json({ message: "Failed to update consultation" });
    }
  });

  app.get("/api/consultations/booked-slots", async (req, res) => {
    try {
      const { teacherId, date } = req.query;
      
      if (!teacherId || !date) {
        return res.status(400).json({ message: "Teacher ID and date are required" });
      }

      const bookedSlots = await storage.getBookedTimeSlots(
        Number(teacherId),
        new Date(date as string)
      );

      res.json(bookedSlots);
    } catch (error) {
      console.error("Get booked slots error:", error);
      res.status(500).json({ message: "Failed to fetch booked slots" });
    }
  });

  // Grades routes
  app.get("/api/grades", async (req, res) => {
    try {
      const { studentId, classId } = req.query;
      
      let grades;
      if (studentId) {
        grades = await storage.getGradesByStudent(Number(studentId));
      } else if (classId) {
        grades = await storage.getGradesByClass(Number(classId));
      } else {
        return res.status(400).json({ message: "Student ID or Class ID is required" });
      }

      res.json(grades);
    } catch (error) {
      console.error("Get grades error:", error);
      res.status(500).json({ message: "Failed to fetch grades" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      const userRole = (req as any).session?.userRole;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (userRole === "teacher") {
        const classes = await storage.getClassesByTeacher(userId);
        const consultations = await storage.getConsultationsByTeacher(userId);
        
        let totalStudents = 0;
        let totalAttendance = 0;
        let attendanceCount = 0;

        for (const cls of classes) {
          const students = await storage.getStudentsByClass(cls.id);
          totalStudents += students.length;
          
          for (const student of students) {
            const stats = await storage.getAttendanceStats(student.id);
            if (stats && typeof stats.rate === 'number') {
              totalAttendance += stats.rate;
              attendanceCount++;
            }
          }
        }

        const avgAttendance = attendanceCount > 0 ? totalAttendance / attendanceCount : 0;

        res.json({
          totalClasses: classes.length,
          totalStudents,
          avgAttendance: avgAttendance.toFixed(1),
          consultations: consultations.length,
        });
      } else {
        const student = await storage.getStudentByUserId(userId);
        if (!student) {
          return res.status(404).json({ message: "Student not found" });
        }

        const grades = await storage.getGradesByStudent(student.id);
        const consultations = await storage.getConsultationsByStudent(student.id);
        const attendanceStats = await storage.getAttendanceStats(student.id);

        // Ensure all values are defined before using them
        const attendanceRate = attendanceStats && typeof attendanceStats.rate === 'number' 
          ? attendanceStats.rate.toFixed(1) 
          : "0.0";

        res.json({
          attendanceRate,
          classCount: 5, // Mock data
          gpa: student.gpa || 0,
          consultations: consultations.length,
          grades: grades.length,
        });
      }
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Consultation Slots routes
  app.post("/api/slots", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { startTime, endTime } = req.body;
      const slots = await storage.createConsultationSlots(userId, startTime, endTime);
      res.status(201).json(slots);
    } catch (error) {
      console.error("Create slots error:", error);
      res.status(500).json({ message: "Failed to create slots" });
    }
  });

  app.get("/api/slots", async (req, res) => {
    try {
      const { teacherId, startTime, endTime, status } = req.query;
      const slots = await storage.getConsultationSlots(
        Number(teacherId),
        startTime as string,
        endTime as string
      );
      res.json(slots);
    } catch (error) {
      console.error("Get slots error:", error);
      res.status(500).json({ message: "Failed to fetch slots" });
    }
  });

  // Bookings routes
  app.post("/api/bookings", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const student = await storage.getStudentByUserId(userId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      let { slotId, purpose, notes, teacherId, date } = req.body;
      let realSlotId = slotId;

      // If slotId is not a number, treat it as startTime-endTime and create the slot
      if (isNaN(Number(slotId)) && teacherId && date && slotId.includes("-")) {
        const [startTime, endTime] = slotId.split("-");
        // Compose full ISO strings for the slot
        const dateStr = date.split("T")[0];
        const slotStart = new Date(`${dateStr}T${startTime}`);
        const slotEnd = new Date(`${dateStr}T${endTime}`);
        
        // Format datetime for MySQL without timezone information
        const formatMySQLDateTime = (date: Date): string => {
          return date.toISOString().slice(0, 19).replace('T', ' ');
        };
        
        // Create the slot in the DB
        const slots = await storage.createConsultationSlots(
          Number(teacherId),
          formatMySQLDateTime(slotStart),
          formatMySQLDateTime(slotEnd)
        );
        // Use the first created slot's id
        if (slots && slots.length > 0) {
          realSlotId = slots[0].id;
        } else {
          throw new Error("Failed to create consultation slot");
        }
      }

      const booking = await storage.createBooking(realSlotId, student.id, purpose, notes);
      res.status(201).json(booking);
    } catch (error) {
      console.error("Create booking error:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.patch("/api/bookings/:id/status", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { id } = req.params;
      const { status, teacherNotes } = req.body;
      const booking = await storage.updateBookingStatus(Number(id), status, teacherNotes);
      res.json(booking);
    } catch (error) {
      console.error("Update booking status error:", error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Teacher Availability routes
  app.get("/api/availability", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const availability = await storage.getTeacherAvailability(userId);
      res.json(availability);
    } catch (error) {
      console.error("Get availability error:", error);
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  app.post("/api/availability", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { timeSlots } = req.body;
      const availability = await storage.updateTeacherAvailability(userId, timeSlots);
      res.json(availability);
    } catch (error) {
      console.error("Update availability error:", error);
      res.status(500).json({ message: "Failed to update availability" });
    }
  });

  app.get("/api/availability/:teacherId/slots", async (req, res) => {
    try {
      const { teacherId } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({ message: "Date is required" });
      }

      const slots = await storage.getAvailableTimeSlots(
        Number(teacherId),
        new Date(date as string)
      );
      res.json(slots);
    } catch (error) {
      console.error("Get available slots error:", error);
      res.status(500).json({ message: "Failed to fetch available slots" });
    }
  });

  // Get all teachers
  app.get("/api/teachers", async (req, res) => {
    try {
      const teachers = await storage.getTeachers();
      res.json(teachers);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      res.status(500).json({ error: "Failed to fetch teachers" });
    }
  });

  // Get teacher availability for a specific date
  app.get("/api/teacher-availability/:teacherId", async (req, res) => {
    try {
      const { teacherId } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({ error: "Date parameter is required" });
      }

      console.log(`Fetching availability for teacher ${teacherId} on date ${date}`);

      // Parse the date and get the day of the week
      const reqDate = new Date(date as string);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = reqDate.getDay();
      const dayName = days[dayOfWeek];
      console.log(`Parsed day: ${dayName}`);

      // Query for that specific day
      const [availabilityRows] = await connection.query(
        'SELECT * FROM teacher_availability WHERE teacher_id = ? AND day = ?',
        [teacherId, dayName]
      );
      console.log(`Availability rows for ${dayName}:`, availabilityRows);

      if (!availabilityRows || (availabilityRows as any[]).length === 0) {
        console.log(`No availability found for teacher ${teacherId} on ${dayName}`);
        return res.json([]); // Return empty array instead of 404
      }

      const availableSlots = await storage.getAvailableTimeSlots(
        Number(teacherId),
        reqDate
      );

      console.log(`Found ${availableSlots.length} available slots for teacher ${teacherId} on ${dayName}:`, availableSlots);
      res.json(availableSlots);
    } catch (error) {
      console.error("Error fetching teacher availability:", error);
      res.status(500).json({ error: "Failed to fetch teacher availability" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}