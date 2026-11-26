import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

// 后端地址可用前端 .env 里的 VITE_API_BASE_URL 覆盖
const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://127.0.0.1:8000/api';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USERNAME_KEY = 'username';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function saveTokens(access: string, refresh?: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// 请求拦截器：自动带上 access token
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// 单飞刷新：并发 401 时只发一次刷新请求
let refreshPromise: Promise<string> | null = null;

async function requestNewAccessToken(): Promise<string> {
  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refresh) {
    throw new Error('登录状态已过期，请重新登录');
  }
  // 用裸 axios，避免走到下面的响应拦截器造成递归
  const { data } = await axios.post<{ access: string; refresh?: string }>(
    `${API_BASE_URL}/token/refresh/`,
    { refresh },
    { headers: { 'Content-Type': 'application/json' }, timeout: 15000 },
  );
  saveTokens(data.access, data.refresh);
  return data.access;
}

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// 响应拦截器：access token 过期时静默刷新并重放原请求
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetriableRequestConfig | undefined;
    const status = error.response?.status;
    // 登录/刷新接口本身返回 401 时不尝试刷新，避免死循环
    const isTokenEndpoint = request?.url?.includes('/token/') ?? false;

    if (status !== 401 || !request || request._retry || isTokenEndpoint) {
      return Promise.reject(error);
    }

    request._retry = true;
    try {
      refreshPromise = refreshPromise ?? requestNewAccessToken();
      const access = await refreshPromise;
      request.headers.set('Authorization', `Bearer ${access}`);
      return await apiClient(request);
    } catch {
      clearTokens();
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
      return Promise.reject(error);
    } finally {
      refreshPromise = null;
    }
  },
);
