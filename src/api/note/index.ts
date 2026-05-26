import request from '../request';
import type { ApiResponse } from '../../utils/api';

export interface NoteAttachment {
  url: string;
  name: string;
  type: 'image' | 'file';
  size?: number;
}

export interface ImportantNote {
  id: number;
  title: string;
  summary: string | null;
  content: string | null;
  attachments?: NoteAttachment[];
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

export const reorderNotes = (orders: { id: number; sort_order: number }[]) =>
  request.post<ApiResponse<null>>('/note/reorder', { orders });

export const uploadNoteFile = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return request.post<ApiResponse<NoteAttachment>>('/note/upload', form, {
    timeout: 120_000,
  });
};
