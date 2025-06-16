import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertClassSchema, insertAttendanceSchema, insertConsultationSchema } from "@shared/schema";
import bcrypt from 'bcrypt';
import { format } from 'date-fns';

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password, role } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.role !== role) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Compare password with hashed password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session
      (req as any).session.userId = user.id;
      (req as any).session.userRole = user.role;

      // Get additional data based on role
      let userData = { ...user };
      if (role === "student") {
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

      let userData = { ...user };
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
    try {
      const userId = (req as any).session?.userId;
      const userRole = (req as any).session?.userRole;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      let consultations;
      if (userRole === "teacher") {
        const teacher = await storage.getTeacherByUserId(userId);
        if (!teacher) {
          return res.status(404).json({ message: "Teacher not found" });
        }
        consultations = await storage.getConsultationsByTeacher(teacher.id);
      } else {
        const student = await storage.getStudentByUserId(userId);
        if (!student) {
          return res.status(404).json({ message: "Student not found" });
        }
        consultations = await storage.getConsultationsByStudent(student.id);
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

      const consultationData = insertConsultationSchema.parse({
        ...req.body,
        studentId: student.id,
        status: "pending",
      });

      const consultation = await storage.createConsultation(consultationData);
      res.status(201).json(consultation);
    } catch (error) {
      console.error("Create consultation error:", error);
      res.status(500).json({ message: "Failed to create consultation" });
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

  // Teacher availability routes
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

      const timeSlots = req.body.timeSlots;
      if (!timeSlots || !Array.isArray(timeSlots)) {
        return res.status(400).json({ message: "Invalid request: timeSlots array is required" });
      }

      console.log("Received availability update request:", {
        userId,
        timeSlots
      });

      const availability = await storage.updateTeacherAvailability(userId, timeSlots);
      res.json(availability);
    } catch (error) {
      console.error("Update availability error:", error);
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update availability" });
      }
    }
  });

  app.get("/api/availability/:teacherId/slots", async (req, res) => {
    try {
      const { teacherId } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({ message: "Date parameter is required" });
      }

      const availableSlots = await storage.getAvailableTimeSlots(
        Number(teacherId),
        new Date(date as string)
      );
      res.json(availableSlots);
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

      const availableSlots = await storage.getAvailableTimeSlots(
        Number(teacherId),
        new Date(date as string)
      );
      res.json(availableSlots);
    } catch (error) {
      console.error("Error fetching teacher availability:", error);
      res.status(500).json({ error: "Failed to fetch teacher availability" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
