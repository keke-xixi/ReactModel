import { Card, Tabs } from 'antd';
import {
  CodeOutlined,
  FieldTimeOutlined,
  BgColorsOutlined,
  KeyOutlined,
  DiffOutlined,
  LockOutlined,
  SwapOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import './index.css';
import JsonTool from './JsonTool';
import EncodeTool from './EncodeTool';
import TimestampTool from './TimestampTool';
import GenerateTool from './GenerateTool';
import RegexTool from './RegexTool';
import HashTool from './HashTool';
import DiffTool from './DiffTool';
import ColorTool from './ColorTool';

const Tool = () => {
  const items = [
    { key: 'json', label: 'JSON', icon: <CodeOutlined />, children: <JsonTool /> },
    { key: 'encode', label: '编解码', icon: <SwapOutlined />, children: <EncodeTool /> },
    { key: 'time', label: '时间戳', icon: <FieldTimeOutlined />, children: <TimestampTool /> },
    { key: 'gen', label: '生成器', icon: <ThunderboltOutlined />, children: <GenerateTool /> },
    { key: 'regex', label: '正则', icon: <KeyOutlined />, children: <RegexTool /> },
    { key: 'hash', label: '哈希', icon: <LockOutlined />, children: <HashTool /> },
    { key: 'diff', label: '文本对比', icon: <DiffOutlined />, children: <DiffTool /> },
    { key: 'color', label: '颜色', icon: <BgColorsOutlined />, children: <ColorTool /> },
  ];

  return (
    <div className="tool-page">
      <Card size="small" title="开发工具箱" styles={{ body: { paddingTop: 12 } }}>
        <Tabs items={items} tabPosition="left" style={{ minHeight: 420 }} />
      </Card>
    </div>
  );
};

export default Tool;
