import request from '../request';
import type { ApiResponse } from '../../utils/api';

export interface KnowledgeCategory {
  id: number;
  parent_id: number;
  name: string;
  description: string | null;
  color?: string;
  sort_order: number;
  status: number;
}

export interface KnowledgePoint {
  id: number;
  category_id: number;
  category_name?: string;
  title: string;
  summary: string | null;
  content: string | null;
  cover_image: string | null;
  images: string[];
  tags: string | null;
  sort_order: number;
  status: number;
  created_at?: string;
  updated_at?: string;
}

export interface BoardColumn extends KnowledgeCategory {
  points: KnowledgePoint[];
}

export const getKnowledgeBoard = (params?: { keyword?: string }) =>
  request.get<ApiResponse<BoardColumn[]>>('/knowledge/board', { params });

export const reorderKnowledgeBoard = (payload: {
  categories?: { id: number; sort_order: number }[];
  points?: { id: number; category_id: number; sort_order: number }[];
}) => request.post<ApiResponse<null>>('/knowledge/board/reorder', payload);

export const getKnowledgeCategories = () =>
  request.get<ApiResponse<KnowledgeCategory[]>>('/knowledge/categories');

export const createKnowledgeCategory = (data: Partial<KnowledgeCategory>) =>
  request.post<ApiResponse<KnowledgeCategory>>('/knowledge/categories', { parent_id: 0, ...data });

export const updateKnowledgeCategory = (id: number, data: Partial<KnowledgeCategory>) =>
  request.put<ApiResponse<KnowledgeCategory>>(`/knowledge/categories/${id}`, data);

export const deleteKnowledgeCategory = (id: number) =>
  request.delete<ApiResponse<null>>(`/knowledge/categories/${id}`);

export const getKnowledgePoint = (id: number) =>
  request.get<ApiResponse<KnowledgePoint>>(`/knowledge/points/${id}`);

export const createKnowledgePoint = (data: Partial<KnowledgePoint>) =>
  request.post<ApiResponse<KnowledgePoint>>('/knowledge/points', data);

export const updateKnowledgePoint = (id: number, data: Partial<KnowledgePoint>) =>
  request.put<ApiResponse<KnowledgePoint>>(`/knowledge/points/${id}`, data);

export const deleteKnowledgePoint = (id: number) =>
  request.delete<ApiResponse<null>>(`/knowledge/points/${id}`);

export const uploadKnowledgeImage = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return request.post<ApiResponse<{ url: string }>>('/knowledge/upload', form, {
    timeout: 120_000,
  });
};
