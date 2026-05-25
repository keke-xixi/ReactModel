import { Card, Col, Descriptions, Row, Switch, Typography, Divider } from 'antd';
import {
  BgColorsOutlined,
  BellOutlined,
  SafetyOutlined,
  GlobalOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const Setting = () => {
  return (
    <div className="page-container">
      <div className="page-card" style={{ marginBottom: 20 }}>
        <Title level={4} className="page-title">
          系统设置
        </Title>
        <Paragraph className="page-desc">
          个性化偏好与系统信息（演示页面，开关仅前端展示）
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <>
                <BgColorsOutlined style={{ marginRight: 8, color: '#4f46e5' }} />
                外观
              </>
            }
            variant="borderless"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <Text strong>紧凑模式</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  减小表格与表单项间距
                </Text>
              </div>
              <Switch defaultChecked={false} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <Text strong>侧边栏默认收起</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  进入系统时折叠菜单
                </Text>
              </div>
              <Switch />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <>
                <BellOutlined style={{ marginRight: 8, color: '#f59e0b' }} />
                通知
              </>
            }
            variant="borderless"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <Text strong>操作成功提示</Text>
              </div>
              <Switch defaultChecked />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <Text strong>接口错误详情</Text>
              </div>
              <Switch defaultChecked />
            </div>
          </Card>
        </Col>
        <Col span={24}>
          <Card
            title={
              <>
                <SafetyOutlined style={{ marginRight: 8, color: '#10b981' }} />
                关于
              </>
            }
            variant="borderless"
          >
            <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
              <Descriptions.Item label="产品名称">Z_Free</Descriptions.Item>
              <Descriptions.Item label="前端">React 18 · Vite · Ant Design 5</Descriptions.Item>
              <Descriptions.Item label="后端">Node.js · Express · MySQL</Descriptions.Item>
              <Descriptions.Item label="主题色">
                <span
                  style={{
                    display: 'inline-block',
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    background: '#4f46e5',
                    verticalAlign: 'middle',
                    marginRight: 6,
                  }}
                />
                Indigo #4f46e5
              </Descriptions.Item>
            </Descriptions>
            <Divider style={{ margin: '16px 0' }} />
            <Text type="secondary">
              <GlobalOutlined style={{ marginRight: 6 }} />
              API 基址由环境变量 VITE_API_BASE_URL 配置，默认 http://localhost:3009/api
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Setting;
