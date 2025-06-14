import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  room: text("room"),
  maxStudents: integer("max_students").default(35),
  schedule: text("schedule"),
  semester: text("semester").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  studentId: text("student_id").notNull().unique(),
  year: text("year").notNull(),
  program: text("program").notNull(),
  gpa: decimal("gpa", { precision: 3, scale: 2 }).default("0.00"),
});

export const classEnrollments = pgTable("class_enrollments", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
});

export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  date: timestamp("date").notNull(),
  status: text("status").notNull(), // "present", "absent", "late"
  markedBy: integer("marked_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const consultations = pgTable("consultations", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  dateTime: timestamp("date_time").notNull(),
  duration: integer("duration").default(60), // minutes
  purpose: text("purpose"),
  status: text("status").notNull().default("pending"), // "pending", "approved", "rejected", "completed"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Assignments table for class activities
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // "quiz", "exam", "assignment", "project", "participation"
  maxScore: decimal("max_score", { precision: 5, scale: 2 }).notNull(),
  weight: decimal("weight", { precision: 3, scale: 2 }).default("1.00"), // Weight for final grade calculation
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Grades table for individual student scores
export const grades = pgTable("grades", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").references(() => assignments.id).notNull(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  score: decimal("score", { precision: 5, scale: 2 }).notNull(),
  letterGrade: text("letter_grade"),
  comments: text("comments"),
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Class = typeof classes.$inferSelect;
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
