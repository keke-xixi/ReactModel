import request from '../request';
import type { ApiResponse } from '../../utils/api';

export interface ImportantNote {
  id: number;
  title: string;
  summary: string | null;
  content: string | null;
  category: string | null;
  color: string;
  is_pinned: number;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface NoteCategoryStat {
  category: string;
  count: number;
}

export const getNoteList = (params?: { keyword?: string; category?: string }) =>
  request.get<ApiResponse<ImportantNote[]>>('/note', { params });

export const getNoteCategories = () =>
  request.get<ApiResponse<NoteCategoryStat[]>>('/note/categories');

export const getNote = (id: number) =>
  request.get<ApiResponse<ImportantNote>>(`/note/${id}`);

export const createNote = (data: Partial<ImportantNote>) =>
  request.post<ApiResponse<ImportantNote>>('/note', data);

export const updateNote = (id: number, data: Partial<ImportantNote>) =>
  request.put<ApiResponse<ImportantNote>>(`/note/${id}`, data);

export const deleteNote = (id: number) =>
  request.delete<ApiResponse<null>>(`/note/${id}`);
