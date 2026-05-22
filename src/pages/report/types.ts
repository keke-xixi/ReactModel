export interface CellStyle {
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
  bgColor?: string;
  fontSize?: number;
}

export interface CellMerge {
  rowspan: number;
  colspan: number;
}

export interface ReportCell {
  value?: string;
  field?: string;
  isRowField?: boolean;
  isRowTemplate?: boolean;
  style?: CellStyle;
  merge?: CellMerge;
}

export interface ReportChart {
  id: string;
  type: 'bar' | 'line' | 'pie';
  title: string;
  categoryField: string;
  valueField: string;
  height?: number;
}

export interface ReportTemplate {
  rows: number;
  cols: number;
  colWidths?: Record<string, number>;
  rowHeights?: Record<string, number>;
  cells: Record<string, ReportCell>;
  dataRowTemplate?: number;
  charts: ReportChart[];
}

export interface ReportRecord {
  id: number;
  reportName: string;
  reportCode: string;
  reportType: string;
  status: number;
  remark?: string | null;
  template?: ReportTemplate;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReportDataPayload {
  fields: Record<string, string | number>;
  rows: Record<string, string | number>[];
}

export interface RenderedReport {
  grid: string[][];
  cellStyles: { r: number; c: number; style: CellStyle }[];
  merges: { r: number; c: number; rowspan: number; colspan: number }[];
  colWidths: Record<string, number>;
  rowHeights?: Record<string, number>;
  charts: ReportChart[];
}

/** 表格默认行高（px），空行也保持可读高度 */
export const DEFAULT_ROW_HEIGHT = 36;

export const DEFAULT_TEMPLATE: ReportTemplate = {
  rows: 12,
  cols: 8,
  colWidths: { 0: 80, 1: 120, 2: 100, 3: 100 },
  cells: {
    '0-0': {
      value: '报表标题',
      style: { bold: true, fontSize: 14, align: 'center', bgColor: '#e6f4ff' },
      merge: { rowspan: 1, colspan: 4 },
    },
    '2-0': { value: '字段A', style: { bold: true, bgColor: '#fafafa' } },
    '2-1': { field: 'fieldA' },
    '3-0': { value: '序号', style: { bold: true, bgColor: '#fafafa', align: 'center' } },
    '3-1': { value: '名称', style: { bold: true, bgColor: '#fafafa' } },
    '4-0': { value: '', isRowTemplate: true, style: { align: 'center' } },
    '4-1': { field: 'name', isRowField: true },
  },
  dataRowTemplate: 4,
  charts: [],
};

export const REPORT_TYPE_OPTIONS = [
  { label: '通用报表', value: 'general' },
  { label: '销售报表', value: 'sales' },
  { label: '统计报表', value: 'stats' },
  { label: '其他', value: 'other' },
];

export const CHART_TYPE_OPTIONS = [
  { label: '柱状图', value: 'bar' },
  { label: '折线图', value: 'line' },
  { label: '饼图', value: 'pie' },
];
