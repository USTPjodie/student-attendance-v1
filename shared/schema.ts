import { mysqlTable, varchar, int, timestamp, decimal, time, datetime, mysqlEnum, boolean } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const classes = mysqlTable("classes", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  teacherId: int("teacher_id").references(() => users.id).notNull(),
  room: varchar("room", { length: 50 }),
  maxStudents: int("max_students").default(35),
  schedule: varchar("schedule", { length: 255 }),
  semester: varchar("semester", { length: 50 }).notNull(),
  description: varchar("description", { length: 1000 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const students = mysqlTable("students", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").references(() => users.id).notNull(),
  studentId: varchar("student_id", { length: 50 }).notNull().unique(),
  year: varchar("year", { length: 50 }).notNull(),
  program: varchar("program", { length: 255 }).notNull(),
  gpa: decimal("gpa", { precision: 3, scale: 2 }).default("0.00"),
});

export const classEnrollments = mysqlTable("class_enrollments", {
  id: int("id").primaryKey().autoincrement(),
  classId: int("class_id").references(() => classes.id).notNull(),
  studentId: int("student_id").references(() => students.id).notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
});

export const attendanceRecords = mysqlTable("attendance_records", {
  id: int("id").primaryKey().autoincrement(),
  classId: int("class_id").references(() => classes.id).notNull(),
  studentId: int("student_id").references(() => students.id).notNull(),
  date: timestamp("date").notNull(),
  status: varchar("status", { length: 50 }).notNull(), // "present", "absent", "late"
  markedBy: int("marked_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const consultations = mysqlTable("consultations", {
  id: int("id").primaryKey().autoincrement(),
  bookingId: int("booking_id").references(() => bookings.id),
  teacherId: int("teacher_id").references(() => users.id).notNull(),
  studentId: int("student_id").references(() => students.id).notNull(),
  dateTime: timestamp("date_time").notNull(),
  duration: int("duration").default(60), // minutes
  purpose: varchar("purpose", { length: 1000 }),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "completed", "cancelled"]).notNull().default("pending"),
  notes: varchar("notes", { length: 1000 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teacherAvailability = mysqlTable("teacher_availability", {
  id: int("id").primaryKey().autoincrement(),
  teacherId: int("teacher_id").references(() => users.id).notNull(),
  day: varchar("day", { length: 20 }).notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const consultationSlots = mysqlTable("consultation_slots", {
  id: int("id").primaryKey().autoincrement(),
  teacherId: int("teacher_id").references(() => users.id).notNull(),
  startTime: datetime("start_time").notNull(),
  endTime: datetime("end_time").notNull(),
  status: mysqlEnum("status", ["available", "booked", "pending_approval"]).notNull().default("available"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bookings = mysqlTable("bookings", {
  id: int("id").primaryKey().autoincrement(),
  slotId: int("slot_id").references(() => consultationSlots.id).notNull(),
  studentId: int("student_id").references(() => students.id).notNull(),
  consultationId: int("consultation_id"),
  status: varchar("status", { length: 20 }).notNull(),
  purpose: varchar("purpose", { length: 1000 }),
  teacherNotes: varchar("teacher_notes", { length: 1000 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Assignments table for class activities
export const assignments = mysqlTable("assignments", {
  id: int("id").primaryKey().autoincrement(),
  classId: int("class_id").references(() => classes.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 1000 }),
  type: varchar("type", { length: 50 }).notNull(), // "quiz", "exam", "assignment", "project", "participation"
  maxScore: decimal("max_score", { precision: 5, scale: 2 }).notNull(),
  weight: decimal("weight", { precision: 3, scale: 2 }).default("1.00"), // Weight for final grade calculation
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Grades table for individual student scores
export const grades = mysqlTable("grades", {
  id: int("id").primaryKey().autoincrement(),
  assignmentId: int("assignment_id").references(() => assignments.id).notNull(),
  studentId: int("student_id").references(() => students.id).notNull(),
  score: decimal("score", { precision: 5, scale: 2 }).notNull(),
  letterGrade: varchar("letter_grade", { length: 50 }),
  comments: varchar("comments", { length: 1000 }),
  gradedAt: timestamp("graded_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
});

export const insertAttendanceSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
  createdAt: true,
});

export const insertConsultationSchema = createInsertSchema(consultations).omit({
  id: true,
  createdAt: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  createdAt: true,
});

export const insertGradeSchema = createInsertSchema(grades).omit({
  id: true,
  gradedAt: true,
});

export const insertConsultationSlotSchema = createInsertSchema(consultationSlots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Class = Omit<typeof classes.$inferSelect, 'createdAt'> & {
  createdAt: string;
  teacher_name?: string;
  first_name?: string;
  last_name?: string;
};
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceSchema>;
export type Consultation = typeof consultations.$inferSelect;
export type InsertConsultation = z.infer<typeof insertConsultationSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Grade = typeof grades.$inferSelect;
export type InsertGrade = z.infer<typeof insertGradeSchema>;
export type ConsultationSlot = typeof consultationSlots.$inferSelect;
export type InsertConsultationSlot = z.infer<typeof insertConsultationSlotSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
