import { Layout, Menu } from 'antd';
import { useEffect, useState } from 'react';
import type { MenuProps } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getMenu } from '../api/home';
import './Layout.css';

const { Header, Sider, Content } = Layout;

const AppLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [menuItems, setMenuItems] = useState<MenuProps['items']>([]);
    const [menuKey, setMenuKey] = useState('home');

    useEffect(() => {
        const path = location.pathname === '/' ? 'home' : location.pathname.slice(1);
        setMenuKey(path || 'home');
    }, [location.pathname]);

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                // const res = await getMenu({ menuName: '' });
                // setMenuItems(res.data.data ?? []);
                setMenuItems(
                    [
                        { label: '首页', key: 'home' }, // key 是必须的
                        { label: '报表', key: 'report' },
                        {
                            label: '系统设置',
                            key: 'system',
                            children: [{ label: '系统参数', key: 'system-params' }], // 子菜单也在这里
                        },
                        { label: '工具', key: 'tool' }
                    ]
                )
            } catch (error) {
                console.error('Failed to load menu:', error);
            }
        };

        fetchMenu();
    }, []);

    const onClick: MenuProps['onClick'] = (e) => {
        const { key } = e;
        setMenuKey(key);
        if (key === 'home') {
            navigate('/');
        } else {
            navigate(`/${key}`);
        }
    };

    return (
        <Layout className="app-layout">
            <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
                <Menu theme="dark" mode="inline" selectedKeys={[menuKey]} onClick={onClick} items={menuItems}></Menu>
            </Sider>
            <Layout>
                <Header className="app-header">React Admin</Header>
                <Content className="app-content">
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default AppLayout;