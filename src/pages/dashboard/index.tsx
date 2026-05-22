import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Col, Row, Statistic, Timeline, Typography } from 'antd';
import ReactECharts from 'echarts-for-react';
import {
  BarChartOutlined,
  BookOutlined,
  DatabaseOutlined,
  ToolOutlined,
  RocketOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { getReportList } from '../../api/report';
import './dashboard.css';

const { Paragraph, Text } = Typography;

type QuickLink = {
  key: string;
  title: string;
  desc: string;
  path: string;
  icon: React.ReactNode;
  gradient: string;
};

const quickLinks: QuickLink[] = [
  {
    key: 'report',
    title: '报表中心',
    desc: '设计模板、填充数据、导出 Excel',
    path: '/report',
    icon: <BarChartOutlined />,
    gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
  },
  {
    key: 'knowledge',
    title: '知识看板',
    desc: '分类管理、拖拽排序、图文详情',
    path: '/knowledge',
    icon: <BookOutlined />,
    gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
  },
  {
    key: 'tool',
    title: '开发工具箱',
    desc: 'JSON、编码、哈希、对比等实用工具',
    path: '/tool',
    icon: <ToolOutlined />,
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
  },
  {
    key: 'params',
    title: '系统参数',
    desc: '键值配置、类型校验、在线维护',
    path: '/system-params',
    icon: <DatabaseOutlined />,
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
  },
];

const hour = new Date().getHours();
const greeting =
  hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';

const Dashboard = () => {
  const navigate = useNavigate();
  const [reportCount, setReportCount] = useState<number | null>(null);

  useEffect(() => {
    getReportList()
      .then((res) => {
        if (res.data.code === 200) setReportCount(res.data.data?.length ?? 0);
      })
      .catch(() => setReportCount(null));
  }, []);

  const chartOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 48, right: 24, top: 40, bottom: 32 },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#64748b' },
    },
    series: [
      {
        name: '访问量',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#4f46e5' },
        itemStyle: { color: '#4f46e5', borderWidth: 2, borderColor: '#fff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(79, 70, 229, 0.35)' },
              { offset: 1, color: 'rgba(79, 70, 229, 0.02)' },
            ],
          },
        },
        data: [120, 182, 151, 234, 290, 330, 310],
      },
    ],
  };

  return (
    <div className="page-container dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-hero-content">
          <h1>
            {greeting}，欢迎回来
          </h1>
          <p>
            React Admin 是一套轻量后台模板：菜单驱动路由、报表可视化设计、知识库看板与常用开发工具，助你快速搭建业务系统。
          </p>
          <div className="dashboard-hero-tags">
            <span className="dashboard-hero-tag">
              <RocketOutlined /> 开箱即用
            </span>
            <span className="dashboard-hero-tag">
              <ThunderboltOutlined /> Ant Design 5
            </span>
            <span className="dashboard-hero-tag">Express + MySQL</span>
          </div>
        </div>
      </section>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="dashboard-stat-card" bordered={false}>
            <div className="dashboard-stat-icon purple">
              <BarChartOutlined />
            </div>
            <Statistic
              title="报表模板"
              value={reportCount ?? '—'}
              suffix={reportCount !== null ? '个' : undefined}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              支持 Excel 式设计与导出
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="dashboard-stat-card" bordered={false}>
            <div className="dashboard-stat-icon cyan">
              <BookOutlined />
            </div>
            <Statistic title="知识模块" value="看板" />
            <Text type="secondary" style={{ fontSize: 12 }}>
              拖拽分类与卡片管理
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="dashboard-stat-card" bordered={false}>
            <div className="dashboard-stat-icon green">
              <ToolOutlined />
            </div>
            <Statistic title="内置工具" value={8} suffix="项" />
            <Text type="secondary" style={{ fontSize: 12 }}>
              JSON / 编码 / 哈希 / 对比等
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="dashboard-stat-card" bordered={false}>
            <div className="dashboard-stat-icon amber">
              <DatabaseOutlined />
            </div>
            <Statistic title="系统能力" value="全栈" />
            <Text type="secondary" style={{ fontSize: 12 }}>
              菜单 · 参数 · 字典 · 报表 API
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            className="dashboard-chart-card"
            title="本周访问趋势（演示）"
            bordered={false}
          >
            <ReactECharts option={chartOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="快捷入口" className="dashboard-quick-card" bordered={false}>
            <Row gutter={[12, 12]}>
              {quickLinks.map((item) => (
                <Col span={24} key={item.key}>
                  <div
                    className="dashboard-quick-item"
                    onClick={() => navigate(item.path)}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(item.path)}
                    role="button"
                    tabIndex={0}
                  >
                    <div
                      className="dashboard-quick-icon"
                      style={{ background: item.gradient }}
                    >
                      {item.icon}
                    </div>
                    <div className="dashboard-quick-text">
                      <h4>{item.title}</h4>
                      <span>{item.desc}</span>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="功能动态" bordered={false}>
            <Timeline
              items={[
                {
                  color: 'blue',
                  children: (
                    <div className="dashboard-timeline-item">
                      <strong>报表模块</strong>
                      <span>2026-05</span>
                      <div>
                        <Text type="secondary">
                          支持类 Excel 设计、字段绑定、动态行扩展与图表 / Excel 导出。
                        </Text>
                      </div>
                    </div>
                  ),
                },
                {
                  color: 'green',
                  children: (
                    <div className="dashboard-timeline-item">
                      <strong>知识看板</strong>
                      <span>拖拽排序</span>
                      <div>
                        <Text type="secondary">列与卡片可拖拽，详情支持多图与封面上传。</Text>
                      </div>
                    </div>
                  ),
                },
                {
                  color: 'gray',
                  children: (
                    <div className="dashboard-timeline-item">
                      <strong>系统管理</strong>
                      <span>菜单 · 参数 · 字典</span>
                      <div>
                        <Text type="secondary">与后端 API 打通，统一 Ant Design 交互体验。</Text>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
