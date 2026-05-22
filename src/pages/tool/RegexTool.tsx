import { useState } from 'react';
import { Button, Input, Space, Tag } from 'antd';

const RegexTool = () => {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [matches, setMatches] = useState<string[]>([]);

  const test = () => {
    setError('');
    setMatches([]);
    if (!pattern) {
      setError('请输入正则表达式');
      return;
    }
    try {
      const reg = new RegExp(pattern, flags);
      if (flags.includes('g')) {
        setMatches([...text.matchAll(reg)].map((m) => m[0]));
      } else {
        const m = reg.exec(text);
        setMatches(m ? [m[0]] : []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '正则无效');
    }
  };

  return (
    <div className="tool-panel">
      <Space wrap style={{ width: '100%' }}>
        <Input
          style={{ flex: 1, minWidth: 200 }}
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="正则，如 ^\d+$"
          addonBefore="/"
          addonAfter={`/${flags}`}
        />
        <Input style={{ width: 120 }} value={flags} onChange={(e) => setFlags(e.target.value)} placeholder="flags: gim" />
        <Button type="primary" onClick={test}>测试</Button>
      </Space>
      <div className="tool-label">测试文本</div>
      <Input.TextArea rows={6} value={text} onChange={(e) => setText(e.target.value)} />
      {error && <div className="tool-output-error">{error}</div>}
      {!error && matches.length > 0 && (
        <>
          <div className="tool-label">匹配 {matches.length} 处</div>
          <Space wrap>
            {matches.map((m, i) => (
              <Tag key={`${m}-${i}`} color="blue">{m}</Tag>
            ))}
          </Space>
        </>
      )}
      {!error && pattern && text && matches.length === 0 && (
        <div className="tool-label" style={{ color: '#999' }}>无匹配</div>
      )}
    </div>
  );
};

export default RegexTool;
