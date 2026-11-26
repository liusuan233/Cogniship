import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { obtainToken, registerUser } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { apiErrorMessage } from '../utils/format';
import RhineMark from '../components/RhineMark';
import AmbientBackground from '../components/AmbientBackground';
import '../styles/rhine-lab.css';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [clock, setClock] = useState(() => new Date());
  const [sessionId] = useState(() =>
    Math.random().toString(16).slice(2, 10).toUpperCase().padEnd(8, '0'),
  );

  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  // 顶栏实时时钟，纯装饰（与登录页一致）
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();

    const trimmed = username.trim();
    if (!trimmed) {
      setError('请输入操作员编号');
      return;
    }
    if (password.length < 6) {
      setError('访问密钥至少 6 位');
      return;
    }
    if (password !== passwordConfirm) {
      setError('两次输入的访问密钥不一致');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      // 1. 登记
      await registerUser({ username: trimmed, password, password_confirm: passwordConfirm });
      // 2. 登记成功后直接静默接入，省掉再输一次凭证
      const token = await obtainToken(trimmed, password);
      login(token.access, token.refresh, trimmed);
      navigate('/', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, '登记失败，请稍后重试'));
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
    <div className="rhine rhine--tall">
      <AmbientBackground variant="paper" />
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
          <span>ENROLLMENT CHANNEL</span>
          <span className="rhine__muted">
            {dateText} {timeText}
          </span>
        </div>
      </header>

      <main className="rhine__panel">
        <section className="rhine__ident">
          <div className="rhine__mark-box">
            <RhineMark className="rhine__mark" animated />
          </div>
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
            <b>PENDING</b>
            <span>NODE</span>
            <b>SHIZHOU-01</b>
          </div>

          <div className="rhine__barcode" aria-hidden="true" />
        </section>

        <section className="rhine__auth">
          <div>
            <div className="rhine__eyebrow">OPERATOR ENROLLMENT</div>
            <h1 className="rhine__title">操作员登记</h1>
            <p className="rhine__hint">
              登记新的操作员编号以接入识舟工作台。登记即刻归档，权限等级由科室复核后下发。
            </p>
          </div>

          <form className="rhine__form" onSubmit={handleRegister}>
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
                  placeholder="设定编号或代号"
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
                  placeholder="至少 6 位"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <div className="rhine__field">
              <label className="rhine__label" htmlFor="password-confirm">
                <span className="rhine__idx">03</span>
                确认密钥 / CONFIRM KEY
              </label>
              <div className="rhine__input-wrap">
                <input
                  id="password-confirm"
                  className="rhine__input"
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  placeholder="再次输入访问密钥"
                  autoComplete="new-password"
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
              <span>{submitting ? '登记中…' : '登 记'}</span>
              <span className="rhine__submit-en">ENROLL</span>
            </button>
          </form>

          <div className="rhine__foot">
            <span className="rhine__muted">已有操作员编号？</span>
            <Link to="/login" className="rhine__link">
              ← 返回身份验证
            </Link>
          </div>

          <div className="rhine__sys" aria-hidden="true">
            <span>SYS.ENROLL</span>
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
