import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/login';
import AppLayout from './layout/Layout';
import HomeEntry from './pages/dashboard/HomeEntry';
import Report from './pages/report';
import ReportDesign from './pages/report/design';
import ReportPreview from './pages/report/preview';
import SystemParams from './pages/system/params';
import SystemMenu from './pages/system/menu';
import SystemDict from './pages/system/dict';
import SystemUsers from './pages/system/user';
import Setting from './pages/setting';
import Knowledge from './pages/knowledge';
import Note from './pages/note';
import Tool from './pages/tool';
import { appTheme } from './theme/antdTheme';

function App() {
  return (
    <ConfigProvider locale={zhCN} theme={appTheme}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<HomeEntry />} />
              <Route path="home" element={<HomeEntry />} />
              <Route path="report" element={<Report />} />
              <Route path="report/design/:id" element={<ReportDesign />} />
              <Route path="report/preview/:id" element={<ReportPreview />} />
              <Route path="system-params" element={<SystemParams />} />
              <Route path="system-menu" element={<SystemMenu />} />
              <Route path="system-dict" element={<SystemDict />} />
              <Route path="system-users" element={<SystemUsers />} />
              <Route path="setting" element={<Setting />} />
              <Route path="tool" element={<Tool />} />
              <Route path="knowledge" element={<Knowledge />} />
              <Route path="note" element={<Note />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
