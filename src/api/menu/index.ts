import request from '../request';
import type { ApiResponse } from '../../utils/api';

export interface MenuRecord {
  id: number;
  parent_id: number;
  level: number;
  type: number;
  label: string;
  menu_key: string;
  path: string | null;
  icon: string | null;
  sort_order: number;
  status: number;
  reserved1: string | null;
  reserved2: string | null;
  created_at?: string;
  updated_at?: string;
}

export type MenuFormValues = Omit<MenuRecord, 'id' | 'level' | 'created_at' | 'updated_at'> & {
  level?: number;
};

export const getMenuList = () =>
  request.get<ApiResponse<MenuRecord[]>>('/menu/list');

export const createMenu = (data: MenuFormValues) =>
  request.post<ApiResponse<MenuRecord>>('/menu', data);

export const updateMenu = (id: number, data: Partial<MenuFormValues>) =>
  request.put<ApiResponse<MenuRecord>>(`/menu/${id}`, data);

export const deleteMenu = (id: number) =>
  request.delete<ApiResponse<null>>(`/menu/${id}`);
