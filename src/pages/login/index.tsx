import { Form, Input, Button, Card } from 'antd';
import { LockOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './login.css';

const Login = () => {
  const navigate = useNavigate();

  const onFinish = () => {
    navigate('/');
  };

  return (
    <div className="login-page">
      <aside className="login-brand">
        <h1>React Admin</h1>
        <p>
          现代化后台管理脚手架：响应式布局、菜单驱动、报表设计、知识库与工具箱，适合二次开发与学习。
        </p>
        <div className="login-brand-features">
          <div className="login-brand-feature">
            <CheckCircleOutlined /> 基于 React 18 + Vite + Ant Design 5
          </div>
          <div className="login-brand-feature">
            <CheckCircleOutlined /> Express 自动挂载 API 路由
          </div>
          <div className="login-brand-feature">
            <CheckCircleOutlined /> MySQL 业务数据持久化
          </div>
        </div>
      </aside>
      <div className="login-form-wrap">
        <Card className="login-card" title="欢迎登录" variant="borderless">
          <p className="login-subtitle">演示环境，任意账号即可进入</p>
          <Form layout="vertical" onFinish={onFinish} size="large">
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="用户名" />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="密码" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" block>
                进入系统
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
