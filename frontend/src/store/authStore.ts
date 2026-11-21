import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  login: (access: string, refresh: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // 初始状态检查本地是否有 token
  isAuthenticated: !!localStorage.getItem('access_token'),
  
  login: (access, refresh) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    set({ isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ isAuthenticated: false });
  },
}));