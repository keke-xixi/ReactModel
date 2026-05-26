import request from '../request';
import type { ApiResponse } from '../../utils/api';

export interface SoftwareItem {
  id: number;
  name: string;
  original_name: string;
  file_url: string;
  file_size: number;
  mime_type: string | null;
  description: string | null;
  category: string | null;
  version: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SoftwareCategoryStat {
  category: string;
  count: number;
}

export const getSoftwareList = (params?: { keyword?: string; category?: string }) =>
  request.get<ApiResponse<SoftwareItem[]>>('/software', { params });

export const getSoftwareCategories = () =>
  request.get<ApiResponse<SoftwareCategoryStat[]>>('/software/categories');

export const uploadSoftware = (
  file: File,
  meta?: { name?: string; description?: string; category?: string; version?: string },
  onProgress?: (percent: number) => void
) => {
  const form = new FormData();
  form.append('file', file);
  if (meta?.name) form.append('name', meta.name);
  if (meta?.description) form.append('description', meta.description);
  if (meta?.category) form.append('category', meta.category);
  if (meta?.version) form.append('version', meta.version);
  return request.post<ApiResponse<SoftwareItem>>('/software/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0,
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
};

export const updateSoftware = (id: number, data: Partial<SoftwareItem>) =>
  request.put<ApiResponse<SoftwareItem>>(`/software/${id}`, data);

export const deleteSoftware = (id: number) =>
  request.delete<ApiResponse<null>>(`/software/${id}`);
