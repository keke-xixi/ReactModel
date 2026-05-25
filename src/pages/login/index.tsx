import { useEffect, useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { LockOutlined, UserOutlined, CheckCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login } from '../../api/auth';
import useAuthStore from '../../store/authStore';
import { enrichMenuItems } from '../../layout/menuIcons';
import './login.css';

const FEATURES = [
  '用户 + 菜单权限配置',
  '个人知识库与笔记',
  'Express + MySQL 持久化',
] as const;

const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    if (token) navigate('/', { replace: true });
  }, [token, navigate]);

  const onFinish = async (values: { username: string; password: string }) => {
    setSubmitting(true);
    try {
      const res = await login(values.username, values.password);
      if (res.data.code !== 200) {
        message.error(res.data.message || '登录失败');
        return;
      }
      const { token, user, menus } = res.data.data;
      setAuth(token, user, enrichMenuItems(menus ?? []));
      message.success('登录成功');
      navigate('/');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '登录失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`login-page ${mounted ? 'login-page--ready' : ''}`}>
      <div className="login-bg" aria-hidden>
        <span className="login-orb login-orb--1" />
        <span className="login-orb login-orb--2" />
        <span className="login-orb login-orb--3" />
        <span className="login-grid" />
      </div>

      <aside className="login-brand">
        <div className="login-brand-inner">
          <div className="login-logo">
            <span className="login-logo-mark" />
            <span className="login-logo-ring" />
          </div>
          <p className="login-brand-eyebrow">Workspace</p>
          <h1 className="login-brand-title">
            Z<span className="login-brand-title-accent">_Free</span>
          </h1>
          <p className="login-brand-desc">
            多用户后台：按账号分配菜单，知识点与重要笔记数据相互隔离。
          </p>
          <ul className="login-brand-features">
            {FEATURES.map((text, i) => (
              <li
                key={text}
                className="login-brand-feature"
                style={{ '--login-stagger': `${0.55 + i * 0.12}s` } as React.CSSProperties}
              >
                <CheckCircleOutlined />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="login-form-wrap">
        <div className="login-panel">
          <header className="login-panel-header">
            <h2>欢迎回来</h2>
            <p>登录以进入你的工作台</p>
          </header>

          <Form layout="vertical" onFinish={onFinish} size="large" autoComplete="off" className="login-form">
            <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input
                prefix={<UserOutlined className="login-input-icon" />}
                placeholder="用户名"
                className="login-input"
              />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password
                prefix={<LockOutlined className="login-input-icon" />}
                placeholder="密码"
                className="login-input"
              />
            </Form.Item>
            <Form.Item className="login-submit-item">
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={submitting}
                className="login-submit-btn"
                icon={!submitting ? <ArrowRightOutlined /> : undefined}
                iconPosition="end"
              >
                {submitting ? '验证中…' : '进入系统'}
              </Button>
            </Form.Item>
          </Form>

          <p className="login-hint">
            {/* <span className="login-hint-sep">·</span>
            测试 <code>admin</code> / <code>1234</code> */}
          </p>
        </div>

        <footer className="login-footer">© {new Date().getFullYear()} Z_Free</footer>
      </div>
    </div>
  );
};

export default Login;
