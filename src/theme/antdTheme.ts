import type { ThemeConfig } from 'antd';

export const appTheme: ThemeConfig = {
  token: {
    colorPrimary: '#4f46e5',
    colorInfo: '#3b82f6',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    borderRadius: 8,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    colorBgLayout: '#f1f5f9',
    colorBgContainer: '#ffffff',
    boxShadowTertiary:
      '0 1px 2px rgba(15, 23, 42, 0.06), 0 4px 12px rgba(15, 23, 42, 0.04)',
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      headerHeight: 56,
      siderBg: '#0f172a',
      triggerBg: '#1e293b',
    },
    Menu: {
      darkItemBg: 'transparent',
      darkSubMenuItemBg: 'transparent',
      darkItemSelectedBg: 'rgba(79, 70, 229, 0.35)',
      itemBorderRadius: 8,
      itemMarginInline: 8,
      itemHeight: 40,
    },
    Table: {
      headerBg: '#f8fafc',
      rowHoverBg: '#f1f5f9',
    },
    Card: {
      borderRadiusLG: 12,
    },
    Button: {
      borderRadius: 8,
    },
  },
};
