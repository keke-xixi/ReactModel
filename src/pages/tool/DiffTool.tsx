import { useState } from 'react';
import { Button, Input } from 'antd';

type DiffLine = { type: 'add' | 'remove' | 'same'; text: string };

const buildDiff = (a: string, b: string): DiffLine[] => {
  const linesA = a.split('\n');
  const linesB = b.split('\n');
  const result: DiffLine[] = [];
  const max = Math.max(linesA.length, linesB.length);
  for (let i = 0; i < max; i += 1) {
    const la = linesA[i];
    const lb = linesB[i];
    if (la === lb) {
      if (la !== undefined) result.push({ type: 'same', text: `  ${la}` });
    } else {
      if (la !== undefined) result.push({ type: 'remove', text: `- ${la}` });
      if (lb !== undefined) result.push({ type: 'add', text: `+ ${lb}` });
    }
  }
  return result;
};

const DiffTool = () => {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [diff, setDiff] = useState<DiffLine[]>([]);

  return (
    <div className="tool-panel">
      <div className="tool-row">
        <div>
          <div className="tool-label">文本 A</div>
          <Input.TextArea rows={12} value={left} onChange={(e) => setLeft(e.target.value)} />
        </div>
        <div>
          <div className="tool-label">文本 B</div>
          <Input.TextArea rows={12} value={right} onChange={(e) => setRight(e.target.value)} />
        </div>
      </div>
      <Button type="primary" onClick={() => setDiff(buildDiff(left, right))}>对比</Button>
      {diff.length > 0 && (
        <>
          <div className="tool-label">差异（- 删除  + 新增）</div>
          <pre className="tool-diff">
            {diff.map((line, i) => (
              <div
                key={i}
                className={
                  line.type === 'add'
                    ? 'diff-line-add'
                    : line.type === 'remove'
                      ? 'diff-line-remove'
                      : 'diff-line-same'
                }
              >
                {line.text || ' '}
              </div>
            ))}
          </pre>
        </>
      )}
    </div>
  );
};

export default DiffTool;
