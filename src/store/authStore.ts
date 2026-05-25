import { create } from 'zustand';
import type { MenuProps } from 'antd';
import type { AuthUser } from '../api/auth';

const TOKEN_KEY = 'token';
const USER_KEY = 'auth_user';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  menus: MenuProps['items'];
  setAuth: (token: string, user: AuthUser, menus: MenuProps['items']) => void;
  setMenus: (menus: MenuProps['items']) => void;
  logout: () => void;
  isLoggedIn: () => boolean;
}

const readStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
};

const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem(TOKEN_KEY),
  user: readStoredUser(),
  menus: [],
  setAuth: (token, user, menus) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user, menus });
  },
  setMenus: (menus) => set({ menus }),
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, user: null, menus: [] });
  },
  isLoggedIn: () => Boolean(get().token),
}));

export default useAuthStore;
