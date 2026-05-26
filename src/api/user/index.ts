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

export interface UserDataStats {
  knowledge_category: number;
  knowledge_point: number;
  important_note: number;
  software: number;
  report: number;
  total: number;
}

export const getUserDataStats = (id: number) =>
  request.get<ApiResponse<{ user: SysUser; stats: UserDataStats }>>(`/user/${id}/data-stats`);

export const clearUserData = (id: number) =>
  request.post<ApiResponse<{ user: SysUser; before: UserDataStats; after: UserDataStats }>>(
    `/user/${id}/data/clear`
  );

export const transferUserData = (fromUserId: number, toUserId: number) =>
  request.post<ApiResponse<unknown>>('/user/data/transfer', {
    from_user_id: fromUserId,
    to_user_id: toUserId,
  });
