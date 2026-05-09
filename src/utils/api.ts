// API相关类型和常量

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    role: string;
  };
}

export const API_ENDPOINTS = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  USERS: '/users',
} as const;