// src/types/index.ts

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  student_id?: string;
  phone_number?: string;
  profile_pic?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  role: "student" | "admin" | null;
  isLoading: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  student_id?: string;
  phone_number?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}