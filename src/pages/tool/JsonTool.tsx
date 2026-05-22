import { useState } from 'react';
import { Button, Input, Space, message } from 'antd';

const JsonTool = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const run = (mode: 'format' | 'minify' | 'validate') => {
    setError('');
    if (!input.trim()) {
      message.warning('请输入 JSON');
      return;
    }
    try {
      const parsed = JSON.parse(input);
      if (mode === 'validate') {
        setOutput('✓ JSON 格式正确');
        message.success('校验通过');
        return;
      }
      setOutput(mode === 'format' ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed));
    } catch (e) {
      const msg = e instanceof Error ? e.message : '解析失败';
      setError(msg);
      setOutput('');
    }
  };

  return (
    <div className="tool-panel">
      <div className="tool-label">输入 JSON</div>
      <Input.TextArea rows={10} value={input} onChange={(e) => setInput(e.target.value)} placeholder='{"name": "demo"}' />
      <Space wrap>
        <Button type="primary" onClick={() => run('format')}>格式化</Button>
        <Button onClick={() => run('minify')}>压缩</Button>
        <Button onClick={() => run('validate')}>校验</Button>
        <Button onClick={() => { setInput(''); setOutput(''); setError(''); }}>清空</Button>
      </Space>
      {error && <div className="tool-output-error">{error}</div>}
      {output && (
        <>
          <div className="tool-label">输出</div>
          <Input.TextArea rows={10} value={output} readOnly />
        </>
      )}
    </div>
  );
};

export default JsonTool;
