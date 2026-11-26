import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { obtainToken } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { apiErrorMessage } from '../utils/format';
import RhineMark from '../components/RhineMark';
import '../styles/rhine-lab.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [clock, setClock] = useState(() => new Date());
  const [sessionId] = useState(() =>
    Math.random().toString(16).slice(2, 10).toUpperCase().padEnd(8, '0'),
  );

  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  // 顶栏的实时时钟，纯装饰
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();

    const trimmed = username.trim();
    if (!trimmed || !password) {
      setError('请输入用户名和密码');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const token = await obtainToken(trimmed, password);
      login(token.access, token.refresh, trimmed);
      navigate('/', { replace: true });
    } catch (err) {
      // 凭证错误时后端返回英文 detail，这里换成统一的中文提示
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('操作员编号或访问密钥不正确，请重新输入');
      } else {
        setError(apiErrorMessage(err, '认证失败，请稍后重试'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const dateText = clock.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const timeText = clock.toLocaleTimeString('zh-CN', { hour12: false });

  return (
    <div className="rhine">
      <div className="rhine__grid" aria-hidden="true" />
      <div className="rhine__scan" aria-hidden="true" />

      <header className="rhine__topbar">
        <div className="rhine__topbar-left">
          <RhineMark className="rhine__topbar-mark" />
          <span className="rhine__brand-name">RHINE LAB</span>
          <span className="rhine__sep">/</span>
          <span className="rhine__muted">莱茵生命 · 认知研究科</span>
        </div>
        <div className="rhine__topbar-right">
          <span className="rhine__dot" aria-hidden="true" />
          <span>SECURE CHANNEL</span>
          <span className="rhine__muted">
            {dateText} {timeText}
          </span>
        </div>
      </header>

      <main className="rhine__panel">
        <section className="rhine__ident">
          <RhineMark className="rhine__mark" animated />
          <div className="rhine__wordmark">
            RHINE
            <br />
            LAB
          </div>
          <div className="rhine__sub">
            COGNITIVE DIVISION
            <br />
            认知研究部门 · 识舟计划
          </div>

          <div className="rhine__readout">
            <span>REG.</span>
            <b>RL-0427-C</b>
            <span>DIV.</span>
            <b>COGNITION</b>
            <span>ACCESS</span>
            <b>LEVEL 03</b>
            <span>NODE</span>
            <b>SHIZHOU-01</b>
          </div>

          <div className="rhine__barcode" aria-hidden="true" />
        </section>

        <section className="rhine__auth">
          <div>
            <div className="rhine__eyebrow">OPERATOR AUTHENTICATION</div>
            <h1 className="rhine__title">身份验证</h1>
            <p className="rhine__hint">
              输入莱茵生命操作员凭证以接入识舟工作台。所有会话均被记录并归档。
            </p>
          </div>

          <form className="rhine__form" onSubmit={handleLogin}>
            <div className="rhine__field">
              <label className="rhine__label" htmlFor="username">
                <span className="rhine__idx">01</span>
                用户名 / OPERATOR ID
              </label>
              <div className="rhine__input-wrap">
                <input
                  id="username"
                  className="rhine__input"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="输入编号或代号"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="rhine__field">
              <label className="rhine__label" htmlFor="password">
                <span className="rhine__idx">02</span>
                密码 / ACCESS KEY
              </label>
              <div className="rhine__input-wrap">
                <input
                  id="password"
                  className="rhine__input"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rhine__alert" role="alert">
                <span className="rhine__alert-tag">ERROR</span>
                <span>{error}</span>
              </div>
            )}

            <button className="rhine__submit" type="submit" disabled={submitting}>
              <span>{submitting ? '认证中…' : '认 证'}</span>
              <span className="rhine__submit-en">AUTHENTICATE</span>
            </button>
          </form>

          <div className="rhine__foot">
            <span className="rhine__muted">尚无操作员编号？</span>
            <Link to="/register" className="rhine__link">
              申请权限 →
            </Link>
          </div>

          <div className="rhine__sys" aria-hidden="true">
            <span>SYS.READY</span>
            <span className="rhine__bar">
              <i />
            </span>
            <span>{sessionId}</span>
          </div>
        </section>
      </main>
    </div>
  );
}
