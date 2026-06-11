import request from '../request';
import type { ApiResponse } from '../../utils/api';

export const CATEGORY_PALETTE = ['orange', 'blue', 'green', 'purple', 'cyan', 'magenta', 'gold', 'geekblue'];

export interface StoredImage {
  id: number;
  file_url: string;
  original_name: string;
  mime_type: string | null;
  file_size: number;
  caption: string | null;
  category: string;
  storage_day: string;
  created_at: string;
}

export interface ImageCategory {
  id: number;
  name: string;
  sort_order: number;
  count: number;
}

export interface ImageDayStat {
  day: string;
  count: number;
}

export interface ImageListResult {
  list: StoredImage[];
  total: number;
  page: number;
  pageSize: number;
}

export const getStoredImages = (params?: {
  day?: string;
  category?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}) => request.get<ApiResponse<ImageListResult>>('/imageStorage', { params });

export const getImageStorageDays = (category?: string) =>
  request.get<ApiResponse<ImageDayStat[]>>('/imageStorage/days', {
    params: category ? { category } : undefined,
  });

export const getImageCategoryLabels = () =>
  request.get<ApiResponse<ImageCategory[]>>('/imageStorage/labels');

export const createImageCategory = (name: string) =>
  request.post<ApiResponse<ImageCategory>>('/imageStorage/labels', { name });

export const updateImageCategory = (id: number, name: string) =>
  request.put<ApiResponse<ImageCategory>>(`/imageStorage/labels/${id}`, { name });

export const deleteImageCategory = (id: number) =>
  request.delete<ApiResponse<null>>(`/imageStorage/labels/${id}`);

export const sendStoredImage = (file: File, opts?: { caption?: string; category?: string }) => {
  const form = new FormData();
  form.append('file', file);
  if (opts?.caption?.trim()) form.append('caption', opts.caption.trim());
  if (opts?.category) form.append('category', opts.category);
  return request.post<ApiResponse<StoredImage>>('/imageStorage/send', form, {
    timeout: 120_000,
  });
};

export const updateStoredImage = (id: number, data: { category?: string; caption?: string }) =>
  request.put<ApiResponse<StoredImage>>(`/imageStorage/${id}`, data);

export const deleteStoredImage = (id: number) =>
  request.delete<ApiResponse<null>>(`/imageStorage/${id}`);
