import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError('两次输入的密码不一致');
      return;
    }

    try {
      // 1. 发起注册请求
      await apiClient.post('/users/register/', { 
        username, 
        password, 
        password_confirm: passwordConfirm 
      });
      
      // 2. 注册成功后，直接静默调用登录接口获取 Token
      const loginResponse = await apiClient.post('/token/', { username, password });
      
      // 3. 保存 Token 并跳转
      login(loginResponse.data.access, loginResponse.data.refresh);
      navigate('/');
    } catch (err: any) {
      // 提取 Django 返回的具体错误信息
      const errorData = err.response?.data;
      if (errorData?.username) {
        setError('用户名已存在');
      } else if (errorData?.password) {
        setError(errorData.password[0]);
      } else {
        setError('注册失败，请稍后重试。');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          注册识舟账号
        </h2>
        
        {error && <div className="mb-4 text-red-500 text-sm text-center">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">密码 (至少6位)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">确认密码</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            注 册
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          已有账号？ <Link to="/login" className="text-blue-600 hover:underline">去登录</Link>
        </div>
      </div>
    </div>
  );
}