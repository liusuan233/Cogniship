import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register'; // 引入

// 初始化 TanStack Query 的客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // 窗口重新聚焦时不自动重新请求（可根据需求开启）
      retry: 1, // 请求失败只重试 1 次
    },
  },
});

// 路由守卫组件：用于拦截未登录用户的访问
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  // 如果未登录，重定向到登录页（replace 避免用户点浏览器后退键又回到受保护页面）
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    // 1. 提供数据请求的全局上下文
    <QueryClientProvider client={queryClient}>
      {/* 2. 提供前端路由上下文 */}
      <BrowserRouter>
        <Routes>
          {/* 公开路由：登录页 */}
          <Route path="/login" element={<Login />} />
          {/* 公开路由：注册页 */}
          <Route path="/register" element={<Register />} />

          {/* 受保护路由：首页工作台 */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          {/* 兜底路由：如果访问不存在的路径，一律重定向回首页 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}