import { apiClient } from './client';
import type { TokenPair } from './types';

export interface RegisterPayload {
  username: string;
  password: string;
  password_confirm: string;
}

/** 用用户名密码换取 JWT */
export async function obtainToken(username: string, password: string): Promise<TokenPair> {
  const { data } = await apiClient.post<TokenPair>('/token/', { username, password });
  return data;
}

/** 注册新用户 */
export async function registerUser(payload: RegisterPayload): Promise<void> {
  await apiClient.post('/users/register/', payload);
}
