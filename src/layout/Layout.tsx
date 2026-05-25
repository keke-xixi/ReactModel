import { Layout, Menu, Breadcrumb, Avatar, Typography, Button, Dropdown } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { MenuProps } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { getMe } from '../api/auth';
import useAuthStore from '../store/authStore';
import { enrichMenuItems, breadcrumbLabels } from './menuIcons';
import './Layout.css';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, menus, setMenus, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const menuItems = useMemo(() => enrichMenuItems(menus), [menus]);

  const menuKey = useMemo(() => {
    const path = location.pathname.replace(/^\//, '');
    if (!path || path === 'home') return 'home';
    if (path.startsWith('report/')) return 'report';
    return path.split('/')[0];
  }, [location.pathname]);

  const breadcrumbs = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length === 0) {
      return [{ title: '首页' }];
    }
    return segments.map((seg) => ({
      title: breadcrumbLabels[seg] || seg,
    }));
  }, [location.pathname]);

  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await getMe();
        if (res.data.code === 200) {
          setMenus(enrichMenuItems(res.data.data.menus ?? []));
        }
      } catch {
        logout();
        navigate('/login', { replace: true });
      }
    };
    refresh();
  }, [setMenus, logout, navigate]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const onClick: MenuProps['onClick'] = (e) => {
    const { key } = e;
    if (key === 'home') {
      navigate('/');
    } else {
      navigate(`/${key}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const timeStr = now.toLocaleString('zh-CN', {
    weekday: 'short',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const displayName = user?.nickname || user?.username || '用户';

  return (
    <Layout className="app-layout">
      <Sider
        className="app-sider"
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        collapsedWidth={64}
        theme="dark"
      >
        <div className="app-logo">
          <div className="app-logo-icon">RA</div>
          {!collapsed && <span className="app-logo-text">Z_Free</span>}
        </div>
        <Menu
          className="app-sider-menu"
          theme="dark"
          mode="inline"
          selectedKeys={[menuKey]}
          onClick={onClick}
          items={menuItems}
        />
      </Sider>
      <Layout className="app-main">
        <Header className="app-header">
          <div className="app-header-left">
            <Breadcrumb items={breadcrumbs} />
          </div>
          <div className="app-header-right">
            <Text className="app-header-time" type="secondary">
              {timeStr}
            </Text>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="app-user">
                <Avatar size={32} icon={<UserOutlined />} style={{ background: '#4f46e5' }} />
                <span className="app-user-name">{displayName}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="app-content">
          <div className="app-content-inner">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
