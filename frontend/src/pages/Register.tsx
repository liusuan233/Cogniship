import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { obtainToken, registerUser } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { apiErrorMessage } from '../utils/format';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();

    const trimmed = username.trim();
    if (!trimmed) {
      setError('请输入用户名');
      return;
    }
    if (password.length < 6) {
      setError('密码至少 6 位');
      return;
    }
    if (password !== passwordConfirm) {
      setError('两次输入的密码不一致');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      // 1. 注册
      await registerUser({ username: trimmed, password, password_confirm: passwordConfirm });
      // 2. 注册成功后直接静默登录，省掉用户再输一次
      const token = await obtainToken(trimmed, password);
      login(token.access, token.refresh, trimmed);
      navigate('/', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, '注册失败，请稍后重试'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">注册识舟账号</h2>

        {error && <div className="mb-4 text-red-500 text-sm text-center">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="username">
              用户名
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="password">
              密码（至少 6 位）
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="password-confirm">
              确认密码
            </label>
            <input
              id="password-confirm"
              type="password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              autoComplete="new-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? '注册中…' : '注 册'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          已有账号？{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            去登录
          </Link>
        </div>
      </div>
    </div>
  );
}
