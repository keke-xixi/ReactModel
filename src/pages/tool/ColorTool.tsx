import { useState } from 'react';
import { Button, Input, InputNumber, Space } from 'antd';

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

const rgbToHex = (r: number, g: number, b: number) => {
  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
};

const ColorTool = () => {
  const [hex, setHex] = useState('#3f51b5');
  const [r, setR] = useState(63);
  const [g, setG] = useState(81);
  const [b, setB] = useState(181);
  const [error, setError] = useState('');

  const syncFromHex = () => {
    setError('');
    const rgb = hexToRgb(hex);
    if (!rgb) {
      setError('HEX 格式无效，如 #3f51b5');
      return;
    }
    setR(rgb.r);
    setG(rgb.g);
    setB(rgb.b);
  };

  const syncFromRgb = () => {
    setError('');
    setHex(rgbToHex(r, g, b));
  };

  return (
    <div className="tool-panel">
      <div
        style={{
          height: 64,
          borderRadius: 8,
          background: hexToRgb(hex) ? hex : '#ccc',
          border: '1px solid #e8e8e8',
          marginBottom: 16,
        }}
      />
      <div className="tool-label">HEX</div>
      <Space wrap>
        <Input value={hex} onChange={(e) => setHex(e.target.value)} style={{ width: 200 }} />
        <Button onClick={syncFromHex}>→ RGB</Button>
      </Space>

      <div className="tool-label" style={{ marginTop: 16 }}>RGB</div>
      <div className="color-rgb-inputs">
        <InputNumber
          min={0}
          max={255}
          value={r}
          onChange={(v) => setR(v ?? 0)}
          addonBefore="R"
          controls
          style={{ width: '100%' }}
        />
        <InputNumber
          min={0}
          max={255}
          value={g}
          onChange={(v) => setG(v ?? 0)}
          addonBefore="G"
          controls
          style={{ width: '100%' }}
        />
        <InputNumber
          min={0}
          max={255}
          value={b}
          onChange={(v) => setB(v ?? 0)}
          addonBefore="B"
          controls
          style={{ width: '100%' }}
        />
        <Button onClick={syncFromRgb} style={{ alignSelf: 'flex-end' }}>→ HEX</Button>
      </div>
      {error && <div className="tool-output-error">{error}</div>}
      <div className="tool-label">CSS</div>
      <Input readOnly value={`color: ${hex};`} />
    </div>
  );
};

export default ColorTool;
