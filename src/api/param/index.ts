import request from '../request';
import type { ApiResponse } from '../../utils/api';

export interface SysParam {
  id: number;
  param_name: string;
  param_key: string;
  param_value: string | null;
  param_type: number;
  sort_order: number;
  status: number;
  remark: string | null;
  created_at?: string;
  updated_at?: string;
}

export const getParamList = (params?: { keyword?: string; status?: number }) =>
  request.get<ApiResponse<SysParam[]>>('/param', { params });

export const createParam = (data: Omit<SysParam, 'id' | 'created_at' | 'updated_at'>) =>
  request.post<ApiResponse<SysParam>>('/param', data);

export const updateParam = (id: number, data: Partial<SysParam>) =>
  request.put<ApiResponse<SysParam>>(`/param/${id}`, data);

export const deleteParam = (id: number) =>
  request.delete<ApiResponse<null>>(`/param/${id}`);
