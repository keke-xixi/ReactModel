import request from '../request';
import type { ApiResponse } from '../../utils/api';

export interface SysUser {
  id: number;
  username: string;
  nickname: string | null;
  status: number;
  is_admin: number;
  menu_ids?: number[];
  created_at?: string;
  updated_at?: string;
}

export type UserFormValues = {
  username: string;
  password?: string;
  nickname: string;
  status: number;
  is_admin: number;
  menu_ids: number[];
};

export const getUserList = () => request.get<ApiResponse<SysUser[]>>('/user');

export const getUser = (id: number) => request.get<ApiResponse<SysUser>>(`/user/${id}`);

export const createUser = (data: UserFormValues) => request.post<ApiResponse<SysUser>>('/user', data);

export const updateUser = (id: number, data: Partial<UserFormValues>) =>
  request.put<ApiResponse<SysUser>>(`/user/${id}`, data);

export const deleteUser = (id: number) => request.delete<ApiResponse<null>>(`/user/${id}`);
