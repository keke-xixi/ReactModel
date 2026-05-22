import { useState, useEffect } from 'react';
import { Button, Input, Space, Radio } from 'antd';

const pad = (n: number, len = 2) => String(n).padStart(len, '0');

const formatMs = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
};

const toDatetimeLocal = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const TimestampTool = () => {
  const [now, setNow] = useState(Date.now());
  const [tsInput, setTsInput] = useState('');
  const [tsUnit, setTsUnit] = useState<'ms' | 's'>('ms');
  const [dateLocal, setDateLocal] = useState(toDatetimeLocal(Date.now()));
  const [result, setResult] = useState('');

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const tsToDate = () => {
    const raw = tsInput.trim();
    if (!raw) return;
    let ms = Number(raw);
    if (tsUnit === 's') ms *= 1000;
    if (Number.isNaN(ms)) {
      setResult('时间戳无效');
      return;
    }
    setResult(formatMs(ms));
    setDateLocal(toDatetimeLocal(ms));
  };

  const dateToTs = () => {
    const ms = new Date(dateLocal).getTime();
    if (Number.isNaN(ms)) {
      setResult('日期无效');
      return;
    }
    setResult(`毫秒: ${ms}\n秒: ${Math.floor(ms / 1000)}`);
    setTsInput(tsUnit === 's' ? String(Math.floor(ms / 1000)) : String(ms));
  };

  return (
    <div className="tool-panel">
      <div className="tool-label">当前时间</div>
      <Input readOnly value={`${now}（毫秒）  ${formatMs(now)}`} />
      <Button
        size="small"
        onClick={() => {
          setTsInput(String(now));
          setTsUnit('ms');
          setDateLocal(toDatetimeLocal(now));
        }}
      >
        填入当前毫秒时间戳
      </Button>

      <div className="tool-row" style={{ marginTop: 16 }}>
        <div>
          <div className="tool-label">时间戳 → 日期</div>
          <Space wrap>
            <Input style={{ width: 200 }} value={tsInput} onChange={(e) => setTsInput(e.target.value)} placeholder="时间戳" />
            <Radio.Group value={tsUnit} onChange={(e) => setTsUnit(e.target.value)}>
              <Radio value="ms">毫秒</Radio>
              <Radio value="s">秒</Radio>
            </Radio.Group>
            <Button type="primary" onClick={tsToDate}>转换</Button>
          </Space>
        </div>
        <div>
          <div className="tool-label">日期 → 时间戳</div>
          <Space wrap>
            <input
              type="datetime-local"
              value={dateLocal}
              onChange={(e) => setDateLocal(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #d9d9d9' }}
            />
            <Button type="primary" onClick={dateToTs}>转换</Button>
          </Space>
        </div>
      </div>
      {result && (
        <>
          <div className="tool-label">结果</div>
          <Input.TextArea rows={3} readOnly value={result} />
        </>
      )}
    </div>
  );
};

export default TimestampTool;
