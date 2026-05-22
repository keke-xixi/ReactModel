import request from '../request';
import type { ApiResponse } from '../../utils/api';
import type { ReportDataPayload, ReportRecord, ReportTemplate, RenderedReport } from '../../pages/report/types';

export const getReportList = (params?: {
  reportName?: string;
  reportCode?: string;
  reportType?: string;
}) => request.get<ApiResponse<ReportRecord[]>>('/report', { params });

export const getReport = (id: number) =>
  request.get<ApiResponse<ReportRecord>>(`/report/${id}`);

export const createReport = (data: {
  reportName: string;
  reportCode: string;
  reportType?: string;
  remark?: string;
  status?: number;
  template?: ReportTemplate;
}) => request.post<ApiResponse<ReportRecord>>('/report', data);

export const updateReport = (
  id: number,
  data: Partial<{
    reportName: string;
    reportCode: string;
    reportType: string;
    remark: string;
    status: number;
    template: ReportTemplate;
  }>,
) => request.put<ApiResponse<ReportRecord>>(`/report/${id}`, data);

export const deleteReport = (id: number) =>
  request.delete<ApiResponse<null>>(`/report/${id}`);

export const getReportData = (id: number) =>
  request.get<ApiResponse<ReportDataPayload>>(`/report/${id}/data`);

export const previewReport = (id: number, data?: ReportDataPayload) =>
  request.post<ApiResponse<{ data: ReportDataPayload; rendered: RenderedReport }>>(
    `/report/${id}/preview`,
    data ? { data } : {},
  );

const assetBase = import.meta.env.VITE_API_BASE_URL || '/api';

export const getReportExcelExportUrl = (id: number) =>
  `${assetBase}/report/${id}/export/excel`;
