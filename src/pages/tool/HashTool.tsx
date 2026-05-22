import { useState } from 'react';
import { Button, Input, Select, Space } from 'antd';

const hashBuffer = async (algo: AlgorithmIdentifier, text: string) => {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest(algo, data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

const HashTool = () => {
  const [input, setInput] = useState('');
  const [algo, setAlgo] = useState<'SHA-256' | 'SHA-384' | 'SHA-512'>('SHA-256');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const run = async () => {
    setError('');
    try {
      const hex = await hashBuffer(algo, input);
      setOutput(hex);
    } catch (e) {
      setError(e instanceof Error ? e.message : '计算失败');
    }
  };

  return (
    <div className="tool-panel">
      <Space wrap>
        <Select
          value={algo}
          onChange={setAlgo}
          style={{ width: 140 }}
          options={[
            { value: 'SHA-256', label: 'SHA-256' },
            { value: 'SHA-384', label: 'SHA-384' },
            { value: 'SHA-512', label: 'SHA-512' },
          ]}
        />
        <Button type="primary" onClick={run}>计算</Button>
      </Space>
      <div className="tool-label">文本</div>
      <Input.TextArea rows={5} value={input} onChange={(e) => setInput(e.target.value)} />
      {error && <div className="tool-output-error">{error}</div>}
      {output && (
        <>
          <div className="tool-label">哈希值（小写 hex）</div>
          <Input.TextArea rows={3} readOnly value={output} />
        </>
      )}
    </div>
  );
};

export default HashTool;
