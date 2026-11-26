import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'font-semibold text-blue-600' : 'text-gray-600 hover:text-blue-600';

export default function Layout() {
  const username = useAuthStore((state) => state.username);
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    // 清掉缓存，避免下一个账号看到上一个账号的数据
    queryClient.clear();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center gap-6 border-b bg-white px-6 py-3">
        <Link to="/" className="text-lg font-bold">
          识舟 Cogniship
        </Link>
        <nav className="flex gap-4 text-sm">
          <NavLink to="/" end className={navLinkClass}>
            工作台
          </NavLink>
          <NavLink to="/logs" className={navLinkClass}>
            学习记录
          </NavLink>
          <NavLink to="/assessments" className={navLinkClass}>
            自我考核
          </NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm text-gray-500">
          <span>{username ?? '已登录'}</span>
          <button type="button" onClick={handleLogout} className="text-red-500 hover:underline">
            退出登录
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
