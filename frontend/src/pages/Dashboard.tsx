import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">识舟工作台</h1>
      <p className="mt-2 text-gray-600">欢迎回来！你的学习航线已就绪。</p>
      <button onClick={handleLogout} className="mt-4 text-red-500 hover:underline">
        退出登录
      </button>
    </div>
  );
}