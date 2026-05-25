import request from './request';
import type { ApiResponse } from '../utils/api';
import type { MenuProps } from 'antd';

export interface AuthUser {
  id: number;
  username: string;
  nickname: string | null;
  is_admin: boolean;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
  menus: MenuProps['items'];
}

export const login = (username: string, password: string) =>
  request.post<ApiResponse<LoginResult>>('/auth/login', { username, password });

export const getMe = () => request.get<ApiResponse<{ user: AuthUser; menus: MenuProps['items'] }>>('/auth/me');
