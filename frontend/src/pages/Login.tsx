import { useState } from 'react';
import { useNavigate, Link} from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';



export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      // 请求 Django 的 JWT 接口
      const response = await apiClient.post('/token/', { username, password });
      login(response.data.access, response.data.refresh);
      navigate('/'); // 登录成功跳转到首页
    } catch (err: any) {
      setError('用户名或密码错误，请重试。');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          登录识舟 Cogniship
        </h2>
        
        {error && <div className="mb-4 text-red-500 text-center">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-6">
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
            <label className="block text-sm font-medium text-gray-700">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            登 录
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-600">
            还没有账号？ <Link to="/register" className="text-blue-600 hover:underline">去注册</Link>
        </div>
      </div>
    </div>
  );
}