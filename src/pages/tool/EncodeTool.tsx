import { useState } from 'react';
import { Button, Input, Radio, Space } from 'antd';

type Mode = 'base64-encode' | 'base64-decode' | 'url-encode' | 'url-decode';

const EncodeTool = () => {
  const [mode, setMode] = useState<Mode>('base64-encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const convert = () => {
    setError('');
    setOutput('');
    try {
      switch (mode) {
        case 'base64-encode':
          setOutput(btoa(unescape(encodeURIComponent(input))));
          break;
        case 'base64-decode':
          setOutput(decodeURIComponent(escape(atob(input.trim()))));
          break;
        case 'url-encode':
          setOutput(encodeURIComponent(input));
          break;
        case 'url-decode':
          setOutput(decodeURIComponent(input));
          break;
        default:
          break;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '转换失败');
    }
  };

  const swap = () => {
    if (output) setInput(output);
    setMode((m) => {
      if (m === 'base64-encode') return 'base64-decode';
      if (m === 'base64-decode') return 'base64-encode';
      if (m === 'url-encode') return 'url-decode';
      return 'url-encode';
    });
    setOutput('');
    setError('');
  };

  return (
    <div className="tool-panel">
      <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)} optionType="button" buttonStyle="solid">
        <Radio.Button value="base64-encode">Base64 编码</Radio.Button>
        <Radio.Button value="base64-decode">Base64 解码</Radio.Button>
        <Radio.Button value="url-encode">URL 编码</Radio.Button>
        <Radio.Button value="url-decode">URL 解码</Radio.Button>
      </Radio.Group>
      <div className="tool-label">输入</div>
      <Input.TextArea rows={6} value={input} onChange={(e) => setInput(e.target.value)} />
      <Space>
        <Button type="primary" onClick={convert}>转换</Button>
        <Button onClick={swap}>交换输入输出</Button>
        <Button onClick={() => { setInput(''); setOutput(''); setError(''); }}>清空</Button>
      </Space>
      {error && <div className="tool-output-error">{error}</div>}
      {output && (
        <>
          <div className="tool-label">输出</div>
          <Input.TextArea rows={6} value={output} readOnly />
        </>
      )}
    </div>
  );
};

export default EncodeTool;
