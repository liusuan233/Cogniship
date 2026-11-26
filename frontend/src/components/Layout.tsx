import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import RhineMark from './RhineMark';
import AmbientBackground from './AmbientBackground';
import '../styles/motion.css';
import '../styles/app-skin.css';

// 顶栏导航：编号 + 中文，激活项由 aria-current="page" 驱动那条信号绿底线
const navItems = [
  { to: '/', idx: '01', label: '工作台', end: true },
  { to: '/logs', idx: '02', label: '学习记录', end: false },
  { to: '/assessments', idx: '03', label: '自我考核', end: false },
];

export default function Layout() {
  const username = useAuthStore((state) => state.username);
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    // 清掉缓存，避免下一个账号看到上一个账号的数据
    queryClient.clear();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell min-h-screen">
      <AmbientBackground />
      <header className="app-header">
        <Link to="/" className="app-brand hover-brand">
          <RhineMark className="app-shell__mark" animated />
          识舟
          <small>COGNISHIP</small>
        </Link>

        <nav className="app-nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} data-idx={item.idx}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="app-id">
          <span className="app-id__dot" aria-hidden="true" />
          <span>
            OPERATOR <b>{username ?? '—'}</b>
          </span>
          <button type="button" onClick={handleLogout} className="btn btn--ghost">
            退出
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-8">
        {/* key 变化才重放动画：换页时淡入，同页内刷新状态不闪 */}
        <div key={location.pathname} className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
