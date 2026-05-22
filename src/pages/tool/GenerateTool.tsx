import { useState } from 'react';
import { Button, Input, InputNumber, Space, Radio } from 'antd';

const uuid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

const randomString = (len: number, charset: string) => {
  let s = '';
  for (let i = 0; i < len; i += 1) {
    s += charset[Math.floor(Math.random() * charset.length)];
  }
  return s;
};

const GenerateTool = () => {
  const [uuidList, setUuidList] = useState('');
  const [randomOut, setRandomOut] = useState('');
  const [len, setLen] = useState(16);
  const [charset, setCharset] = useState<'alnum' | 'hex' | 'all'>('alnum');

  const genUuid = (count: number) => {
    setUuidList(Array.from({ length: count }, () => uuid()).join('\n'));
  };

  const genRandom = () => {
    const sets = {
      alnum: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
      hex: '0123456789abcdef',
      all: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*',
    };
    setRandomOut(randomString(len, sets[charset]));
  };

  return (
    <div className="tool-panel">
      <div className="tool-label">UUID</div>
      <Space wrap style={{ marginBottom: 8 }}>
        <Button type="primary" onClick={() => genUuid(1)}>生成 1 个</Button>
        <Button onClick={() => genUuid(5)}>生成 5 个</Button>
        <Button onClick={() => setUuidList('')}>清空</Button>
      </Space>
      <Input.TextArea rows={4} value={uuidList} readOnly placeholder="点击生成" />

      <div className="tool-label" style={{ marginTop: 20 }}>随机字符串</div>
      <Space wrap style={{ marginBottom: 8 }}>
        <span>长度</span>
        <InputNumber min={1} max={256} value={len} onChange={(v) => setLen(v ?? 16)} />
        <Radio.Group value={charset} onChange={(e) => setCharset(e.target.value)}>
          <Radio value="alnum">字母数字</Radio>
          <Radio value="hex">十六进制</Radio>
          <Radio value="all">含符号</Radio>
        </Radio.Group>
        <Button type="primary" onClick={genRandom}>生成</Button>
      </Space>
      <Input value={randomOut} readOnly placeholder="点击生成" />
    </div>
  );
};

export default GenerateTool;
