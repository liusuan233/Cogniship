import { create } from 'zustand';
import { clearTokens, saveTokens } from '../api/client';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  login: (access: string, refresh: string, username: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // 初始状态检查本地是否有 token
  isAuthenticated: !!localStorage.getItem('access_token'),
  username: localStorage.getItem('username'),

  login: (access, refresh, username) => {
    saveTokens(access, refresh);
    localStorage.setItem('username', username);
    set({ isAuthenticated: true, username });
  },

  logout: () => {
    clearTokens();
    set({ isAuthenticated: false, username: null });
  },
}));
