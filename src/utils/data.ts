// 数据类型定义

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface MenuItem {
  key: string;
  label: string;
  path?: string;
  icon?: string;
  children?: MenuItem[];
}

export interface TableColumn<T> {
  title: string;
  dataIndex: keyof T;
  key: string;
  render?: (value: any, record: T) => React.ReactNode;
}

export type SortOrder = 'ascend' | 'descend' | null;