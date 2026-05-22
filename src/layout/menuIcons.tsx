import type { ReactNode } from 'react';
import type { MenuProps } from 'antd';
import {
  AppstoreOutlined,
  BarChartOutlined,
  BookOutlined,
  HomeOutlined,
  SettingOutlined,
  ToolOutlined,
  DatabaseOutlined,
  MenuOutlined,
  FileTextOutlined,
} from '@ant-design/icons';

const ICON_BY_KEY: Record<string, ReactNode> = {
  home: <HomeOutlined />,
  report: <BarChartOutlined />,
  knowledge: <BookOutlined />,
  system: <SettingOutlined />,
  'system-params': <DatabaseOutlined />,
  'system-menu': <MenuOutlined />,
  'system-dict': <FileTextOutlined />,
  tool: <ToolOutlined />,
  setting: <SettingOutlined />,
};

export function enrichMenuItems(items?: MenuProps['items']): MenuProps['items'] {
  if (!items) return [];
  return items.map((item) => {
    if (!item || typeof item !== 'object' || !('key' in item)) return item;
    const key = String(item.key);
    const children = 'children' in item && item.children
      ? enrichMenuItems(item.children as MenuProps['items'])
      : undefined;
    return {
      ...item,
      icon: ICON_BY_KEY[key] ?? <AppstoreOutlined />,
      children,
    };
  });
}

export const breadcrumbLabels: Record<string, string> = {
  home: '首页',
  report: '报表',
  knowledge: '知识点',
  'system-params': '系统参数',
  'system-menu': '菜单管理',
  'system-dict': '字典管理',
  tool: '工具箱',
  setting: '设置',
};
