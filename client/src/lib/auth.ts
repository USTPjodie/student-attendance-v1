import { apiRequest } from "./queryClient";

export interface LoginCredentials {
  email: string;
  password: string;
  role: "teacher" | "student";
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  student?: {
    id: number;
    studentId: string;
    year: string;
    program: string;
    gpa: string;
  };
}

export async function login(credentials: LoginCredentials): Promise<User> {
  const response = await apiRequest("POST", "/api/auth/login", credentials);
  const data = await response.json();
  return data.user;
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
}
