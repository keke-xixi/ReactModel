import request from '../request';
import type { ApiResponse } from '../../utils/api';

export interface DictType {
  id: number;
  dict_name: string;
  dict_type: string;
  status: number;
  remark: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DictData {
  id: number;
  dict_type: string;
  dict_label: string;
  dict_value: string;
  sort_order: number;
  status: number;
  remark: string | null;
  created_at?: string;
  updated_at?: string;
}

export const getDictTypes = (params?: { keyword?: string; status?: number }) =>
  request.get<ApiResponse<DictType[]>>('/dict/types', { params });

export const createDictType = (data: Omit<DictType, 'id' | 'created_at' | 'updated_at'>) =>
  request.post<ApiResponse<DictType>>('/dict/types', data);

export const updateDictType = (id: number, data: Partial<DictType>) =>
  request.put<ApiResponse<DictType>>(`/dict/types/${id}`, data);

export const deleteDictType = (id: number) =>
  request.delete<ApiResponse<null>>(`/dict/types/${id}`);

export const getDictData = (params: { dictType: string; keyword?: string; status?: number }) =>
  request.get<ApiResponse<DictData[]>>('/dict/data', { params });

export const createDictData = (data: Omit<DictData, 'id' | 'created_at' | 'updated_at'>) =>
  request.post<ApiResponse<DictData>>('/dict/data', data);

export const updateDictData = (id: number, data: Partial<DictData>) =>
  request.put<ApiResponse<DictData>>(`/dict/data/${id}`, data);

export const deleteDictData = (id: number) =>
  request.delete<ApiResponse<null>>(`/dict/data/${id}`);
