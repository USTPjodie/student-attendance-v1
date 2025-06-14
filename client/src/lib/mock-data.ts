export interface MockClass {
  id: number;
  code: string;
  name: string;
  instructor: string;
  schedule: string;
  room: string;
  attendanceRate: number;
  present: number;
  total: number;
}

export interface MockStudent {
  id: number;
  name: string;
  email: string;
  studentId: string;
  year: string;
  program: string;
  gpa: string;
  attendanceRate: number;
  initials: string;
}

export interface MockConsultation {
  id: number;
  student: {
    name: string;
    email: string;
  };
  teacher: string;
  dateTime: string;
  purpose: string;
  status: "pending" | "approved" | "rejected" | "completed";
}

export interface MockGrade {
  id: number;
  classCode: string;
  className: string;
  assignmentName: string;
  score: number;
  maxScore: number;
  percentage: number;
  letterGrade: string;
}

export const mockClasses: MockClass[] = [
  {
    id: 1,
    code: "CS 101",
    name: "Programming Fundamentals",
    instructor: "Prof. Smith",
    schedule: "MWF 9:00-10:30 AM",
    room: "Room 204",
    attendanceRate: 95,
    present: 19,
    total: 20,
  },
  {
    id: 2,
    code: "CS 201",
    name: "Data Structures",
    instructor: "Prof. Johnson",
    schedule: "TTh 1:00-2:30 PM",
    room: "Room 305",
    attendanceRate: 88,
    present: 15,
    total: 17,
  },
  {
    id: 3,
    code: "CS 301",
    name: "Software Engineering",
    instructor: "Prof. Williams",
    schedule: "MWF 3:00-4:30 PM",
    room: "Room 201",
    attendanceRate: 82,
    present: 14,
    total: 17,
  },
  {
    id: 4,
    code: "MATH 203",
    name: "Discrete Mathematics",
    instructor: "Prof. Davis",
    schedule: "TTh 10:00-11:30 AM",
    room: "Room 102",
    attendanceRate: 75,
    present: 12,
    total: 16,
  },
];

export const mockStudents: MockStudent[] = [
  {
    id: 1,
    name: "Alice Doe",
    email: "alice.doe@student.ustp.edu.ph",
    studentId: "2023-001",
    year: "3rd Year",
    program: "Computer Science",
    gpa: "3.75",
    attendanceRate: 92,
    initials: "AD",
  },
  {
    id: 2,
    name: "John Smith",
    email: "john.smith@student.ustp.edu.ph",
    studentId: "2023-002",
    year: "2nd Year",
    program: "Information Technology",
    gpa: "3.60",
    attendanceRate: 88,
    initials: "JS",
  },
  {
    id: 3,
    name: "Maria Garcia",
    email: "maria.garcia@student.ustp.edu.ph",
    studentId: "2023-003",
    year: "4th Year",
    program: "Computer Science",
    gpa: "3.85",
    attendanceRate: 95,
    initials: "MG",
  },
  {
    id: 4,
    name: "Mike Brown",
    email: "mike.brown@student.ustp.edu.ph",
    studentId: "2023-004",
    year: "1st Year",
    program: "Engineering",
    gpa: "3.40",
    attendanceRate: 78,
    initials: "MB",
  },
];

export const mockConsultations: MockConsultation[] = [
  {
    id: 1,
    student: {
      name: "Alice Doe",
      email: "alice.doe@student.ustp.edu.ph",
    },
    teacher: "Prof. Smith",
    dateTime: "2024-12-15 10:00",
    purpose: "Discussion about midterm grades and upcoming assignments",
    status: "pending",
  },
  {
    id: 2,
    student: {
      name: "John Smith",
      email: "john.smith@student.ustp.edu.ph",
    },
    teacher: "Prof. Johnson",
    dateTime: "2024-12-15 14:00",
    purpose: "Career guidance and course selection for next semester",
    status: "approved",
  },
  {
    id: 3,
    student: {
      name: "Maria Garcia",
      email: "maria.garcia@student.ustp.edu.ph",
    },
    teacher: "Prof. Davis",
    dateTime: "2024-12-14 09:00",
    purpose: "Help with discrete mathematics assignment",
    status: "completed",
  },
];

export const mockGrades: MockGrade[] = [
  {
    id: 1,
    classCode: "CS 101",
    className: "Programming Fundamentals",
    assignmentName: "Quiz 1",
    score: 95,
    maxScore: 100,
    percentage: 95,
    letterGrade: "A",
  },
  {
    id: 2,
    classCode: "CS 101",
    className: "Programming Fundamentals",
    assignmentName: "Midterm Exam",
    score: 88,
    maxScore: 100,
    percentage: 88,
    letterGrade: "B+",
  },
  {
    id: 3,
    classCode: "CS 201",
    className: "Data Structures",
    assignmentName: "Programming Assignment 1",
    score: 92,
    maxScore: 100,
    percentage: 92,
    letterGrade: "A-",
  },
  {
    id: 4,
    classCode: "MATH 203",
    className: "Discrete Mathematics",
    assignmentName: "Problem Set 1",
    score: 85,
    maxScore: 100,
    percentage: 85,
    letterGrade: "B",
  },
];

export const mockDashboardStats = {
  teacher: {
    totalClasses: 6,
    totalStudents: 245,
    avgAttendance: 87.5,
    consultations: 12,
  },
  student: {
    attendanceRate: 92.5,
    classCount: 5,
    gpa: 3.75,
    consultations: 3,
  },
};

export const mockAttendanceData = [
  { day: "Mon", attendance: 85 },
  { day: "Tue", attendance: 92 },
  { day: "Wed", attendance: 78 },
  { day: "Thu", attendance: 96 },
  { day: "Fri", attendance: 88 },
];

// Helper functions
export const getStudentInitials = (firstName: string, lastName: string): string => {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
};

export const getAttendanceColor = (rate: number): string => {
  if (rate >= 90) return "text-green-600";
  if (rate >= 75) return "text-yellow-600";
  return "text-red-600";
};

export const getAttendanceStatus = (rate: number): string => {
  if (rate >= 90) return "Excellent";
  if (rate >= 75) return "Good";
  return "Needs Improvement";
};

export const formatGPA = (gpa: number): string => {
  return gpa.toFixed(2);
};

export const getLetterGrade = (percentage: number): string => {
  if (percentage >= 97) return "A+";
  if (percentage >= 93) return "A";
  if (percentage >= 90) return "A-";
  if (percentage >= 87) return "B+";
  if (percentage >= 83) return "B";
  if (percentage >= 80) return "B-";
  if (percentage >= 77) return "C+";
  if (percentage >= 73) return "C";
  if (percentage >= 70) return "C-";
  if (percentage >= 67) return "D+";
  if (percentage >= 65) return "D";
  return "F";
};
