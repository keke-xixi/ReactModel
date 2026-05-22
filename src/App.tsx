import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import Login from './pages/login';
import AppLayout from './layout/Layout';
import Dashboard from './pages/dashboard';
import Report from './pages/report';
import SystemParams from './pages/system/params';
import SystemMenu from './pages/system/menu';
import SystemDict from './pages/system/dict';
import Setting from './pages/setting';
import Knowledge from './pages/knowledge';
import Tool from './pages/tool';

function App() {
    return (
        <ConfigProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    {/* 后端改动菜单 key，对应调整下path */}
                    <Route path="/" element={<AppLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="home" element={<Dashboard />} />
                        <Route path="report" element={<Report />} />
                        <Route path="system-params" element={<SystemParams />} />
                        <Route path="system-menu" element={<SystemMenu />} />
                        <Route path="system-dict" element={<SystemDict />} />
                        <Route path="setting" element={<Setting />} />
                        <Route path="tool" element={<Tool />} />
                        <Route path="knowledge" element={<Knowledge />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </ConfigProvider>
    );
}

export default App;