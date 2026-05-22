import { Layout, Menu, Breadcrumb, Avatar, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { MenuProps } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { UserOutlined } from '@ant-design/icons';
import { getMenu } from '../api/home';
import { enrichMenuItems, breadcrumbLabels } from './menuIcons';
import './Layout.css';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuProps['items']>([]);
  const [now, setNow] = useState(() => new Date());

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
    return segments.map((seg, i) => ({
      title: breadcrumbLabels[seg] || seg,
      ...(i < segments.length - 1 ? {} : {}),
    }));
  }, [location.pathname]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await getMenu({ menuName: '' });
        if (res.data.code === 200) {
          setMenuItems(enrichMenuItems(res.data.data ?? []));
        }
      } catch (error) {
        console.error('Failed to load menu:', error);
      }
    };
    fetchMenu();
  }, []);

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

  const timeStr = now.toLocaleString('zh-CN', {
    weekday: 'short',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

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
          {!collapsed && <span className="app-logo-text">React Admin</span>}
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
            <div className="app-user">
              <Avatar size={32} icon={<UserOutlined />} style={{ background: '#4f46e5' }} />
              <span className="app-user-name">管理员</span>
            </div>
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
