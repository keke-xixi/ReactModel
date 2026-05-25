import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { getFirstMenuPath, menuHasKey } from '../../utils/firstMenuPath';
import Dashboard from './index';

/** 有首页权限则展示 Dashboard，否则跳到第一个有权限的菜单页 */
const HomeEntry = () => {
  const menus = useAuthStore((s) => s.menus);

  if (menus?.length && !menuHasKey(menus, 'home')) {
    return <Navigate to={getFirstMenuPath(menus)} replace />;
  }

  return <Dashboard />;
};

export default HomeEntry;
