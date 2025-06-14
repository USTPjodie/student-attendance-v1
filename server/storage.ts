import {
  users,
  classes,
  students,
  classEnrollments,
  attendanceRecords,
  consultations,
  grades,
  type User,
  type InsertUser,
  type Class,
  type InsertClass,
  type Student,
  type InsertStudent,
  type AttendanceRecord,
  type InsertAttendanceRecord,
  type Consultation,
  type InsertConsultation,
  type Grade,
  type InsertGrade,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Class operations
  getClasses(): Promise<Class[]>;
  getClassesByTeacher(teacherId: number): Promise<Class[]>;
  getClass(id: number): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: number, classData: Partial<InsertClass>): Promise<Class>;
  deleteClass(id: number): Promise<void>;
  
  // Student operations
  getStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByUserId(userId: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  getStudentsByClass(classId: number): Promise<Student[]>;
  
  // Attendance operations
  getAttendanceRecords(classId: number, date?: Date): Promise<AttendanceRecord[]>;
  markAttendance(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  updateAttendance(id: number, status: string): Promise<AttendanceRecord>;
  getAttendanceStats(studentId: number): Promise<any>;
  
  // Consultation operations
  getConsultations(): Promise<Consultation[]>;
  getConsultationsByTeacher(teacherId: number): Promise<Consultation[]>;
  getConsultationsByStudent(studentId: number): Promise<Consultation[]>;
  createConsultation(consultation: InsertConsultation): Promise<Consultation>;
  updateConsultation(id: number, updates: Partial<InsertConsultation>): Promise<Consultation>;
  
  // Grade operations
  getGradesByStudent(studentId: number): Promise<Grade[]>;
  getGradesByClass(classId: number): Promise<Grade[]>;
  createGrade(grade: InsertGrade): Promise<Grade>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private classes: Map<number, Class>;
  private students: Map<number, Student>;
  private attendanceRecords: Map<number, AttendanceRecord>;
  private consultations: Map<number, Consultation>;
  private grades: Map<number, Grade>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.classes = new Map();
    this.students = new Map();
    this.attendanceRecords = new Map();
    this.consultations = new Map();
    this.grades = new Map();
    this.currentId = 1;
    
    // Initialize with mock data
    this.initializeMockData();
  }

  private initializeMockData() {
    // Create mock teacher
    const teacher = this.createUserSync({
      email: "prof.smith@ustp.edu.ph",
      password: "password123",
      firstName: "Prof",
      lastName: "Smith",
      role: "teacher",
    });

    // Create mock student
    const studentUser = this.createUserSync({
      email: "alice.doe@student.ustp.edu.ph",
      password: "password123",
      firstName: "Alice",
      lastName: "Doe",
      role: "student",
    });

    // Create mock student record
    const student = this.createStudentSync({
      userId: studentUser.id,
      studentId: "2023-001",
      year: "3rd Year",
      program: "Computer Science",
      gpa: "3.75",
    });

    // Create mock classes
    const class1 = this.createClassSync({
      name: "Programming Fundamentals",
      code: "CS 101",
      teacherId: teacher.id,
      room: "Room 204",
      maxStudents: 35,
      schedule: "MWF 9:00-10:30 AM",
      semester: "Fall 2024",
      description: "Introduction to programming concepts",
    });

    const class2 = this.createClassSync({
      name: "Data Structures",
      code: "CS 201",
      teacherId: teacher.id,
      room: "Room 305",
      maxStudents: 30,
      schedule: "TTh 1:00-2:30 PM",
      semester: "Fall 2024",
      description: "Advanced data structures and algorithms",
    });

    // Create mock grades
    this.createGradeSync({
      classId: class1.id,
      studentId: student.id,
      assignmentName: "Quiz 1",
      score: "95.00",
      maxScore: "100.00",
    });

    this.createGradeSync({
      classId: class1.id,
      studentId: student.id,
      assignmentName: "Midterm Exam",
      score: "88.50",
      maxScore: "100.00",
    });
  }

  private createUserSync(userData: InsertUser): User {
    const id = this.currentId++;
    const user: User = { ...userData, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  private createStudentSync(studentData: InsertStudent): Student {
    const id = this.currentId++;
    const student: Student = { ...studentData, id };
    this.students.set(id, student);
    return student;
  }

  private createClassSync(classData: InsertClass): Class {
    const id = this.currentId++;
    const classObj: Class = { ...classData, id, createdAt: new Date() };
    this.classes.set(id, classObj);
    return classObj;
  }

  private createGradeSync(gradeData: InsertGrade): Grade {
    const id = this.currentId++;
    const grade: Grade = { ...gradeData, id, gradedAt: new Date() };
    this.grades.set(id, grade);
    return grade;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...userData, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  // Class operations
  async getClasses(): Promise<Class[]> {
    return Array.from(this.classes.values());
  }

  async getClassesByTeacher(teacherId: number): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(cls => cls.teacherId === teacherId);
  }

  async getClass(id: number): Promise<Class | undefined> {
    return this.classes.get(id);
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const id = this.currentId++;
    const classObj: Class = { ...classData, id, createdAt: new Date() };
    this.classes.set(id, classObj);
    return classObj;
  }

  async updateClass(id: number, classData: Partial<InsertClass>): Promise<Class> {
    const existingClass = this.classes.get(id);
    if (!existingClass) {
      throw new Error("Class not found");
    }
    const updatedClass = { ...existingClass, ...classData };
    this.classes.set(id, updatedClass);
    return updatedClass;
  }

  async deleteClass(id: number): Promise<void> {
    this.classes.delete(id);
  }

  // Student operations
  async getStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getStudentByUserId(userId: number): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(student => student.userId === userId);
  }

  async createStudent(studentData: InsertStudent): Promise<Student> {
    const id = this.currentId++;
    const student: Student = { ...studentData, id };
    this.students.set(id, student);
    return student;
  }

  async getStudentsByClass(classId: number): Promise<Student[]> {
    // For mock data, return all students for any class
    return Array.from(this.students.values());
  }

  // Attendance operations
  async getAttendanceRecords(classId: number, date?: Date): Promise<AttendanceRecord[]> {
    return Array.from(this.attendanceRecords.values()).filter(record => 
      record.classId === classId && 
      (!date || record.date.toDateString() === date.toDateString())
    );
  }

  async markAttendance(recordData: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const id = this.currentId++;
    const record: AttendanceRecord = { ...recordData, id, createdAt: new Date() };
    this.attendanceRecords.set(id, record);
    return record;
  }

  async updateAttendance(id: number, status: string): Promise<AttendanceRecord> {
    const record = this.attendanceRecords.get(id);
    if (!record) {
      throw new Error("Attendance record not found");
    }
    const updated = { ...record, status };
    this.attendanceRecords.set(id, updated);
    return updated;
  }

  async getAttendanceStats(studentId: number): Promise<any> {
    const records = Array.from(this.attendanceRecords.values())
      .filter(record => record.studentId === studentId);
    
    const total = records.length;
    const present = records.filter(record => record.status === "present").length;
    
    return {
      total,
      present,
      rate: total > 0 ? (present / total) * 100 : 0,
    };
  }

  // Consultation operations
  async getConsultations(): Promise<Consultation[]> {
    return Array.from(this.consultations.values());
  }

  async getConsultationsByTeacher(teacherId: number): Promise<Consultation[]> {
    return Array.from(this.consultations.values()).filter(c => c.teacherId === teacherId);
  }

  async getConsultationsByStudent(studentId: number): Promise<Consultation[]> {
    return Array.from(this.consultations.values()).filter(c => c.studentId === studentId);
  }

  async createConsultation(consultationData: InsertConsultation): Promise<Consultation> {
    const id = this.currentId++;
    const consultation: Consultation = { ...consultationData, id, createdAt: new Date() };
    this.consultations.set(id, consultation);
    return consultation;
  }

  async updateConsultation(id: number, updates: Partial<InsertConsultation>): Promise<Consultation> {
    const consultation = this.consultations.get(id);
    if (!consultation) {
      throw new Error("Consultation not found");
    }
    const updated = { ...consultation, ...updates };
    this.consultations.set(id, updated);
    return updated;
  }

  // Grade operations
  async getGradesByStudent(studentId: number): Promise<Grade[]> {
    return Array.from(this.grades.values()).filter(grade => grade.studentId === studentId);
  }

  async getGradesByClass(classId: number): Promise<Grade[]> {
    return Array.from(this.grades.values()).filter(grade => grade.classId === classId);
  }

  async createGrade(gradeData: InsertGrade): Promise<Grade> {
    const id = this.currentId++;
    const grade: Grade = { ...gradeData, id, gradedAt: new Date() };
    this.grades.set(id, grade);
    return grade;
  }
}

export const storage = new MemStorage();
