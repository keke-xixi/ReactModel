import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Checkbox,
  Col,
  Drawer,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  message,
} from 'antd';
import { ArrowLeftOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { getReport, updateReport } from '../../api/report';
import ReportGrid from './components/ReportGrid';
import type { ReportCell, ReportChart, ReportTemplate } from './types';
import { CHART_TYPE_OPTIONS, DEFAULT_TEMPLATE } from './types';
import './report.css';

const cellKey = (r: number, c: number) => `${r}-${c}`;

const ReportDesign = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reportId = Number(id);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reportName, setReportName] = useState('');
  const [template, setTemplate] = useState<ReportTemplate>(DEFAULT_TEMPLATE);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [chartDrawer, setChartDrawer] = useState(false);
  const [chartForm] = Form.useForm<ReportChart>();

  const selectedKey = selected ? cellKey(selected.r, selected.c) : null;
  const selectedCell: ReportCell | undefined = selectedKey
    ? template.cells[selectedKey]
    : undefined;

  const load = useCallback(async () => {
    if (!reportId) return;
    setLoading(true);
    try {
      const res = await getReport(reportId);
      if (res.data.code === 200 && res.data.data) {
        setReportName(res.data.data.reportName);
        setTemplate(res.data.data.template || DEFAULT_TEMPLATE);
      } else {
        message.error(res.data.message || '加载失败');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '加载报表失败');
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateCell = (patch: Partial<ReportCell>) => {
    if (!selected) return;
    const key = cellKey(selected.r, selected.c);
    setTemplate((prev) => ({
      ...prev,
      cells: {
        ...prev.cells,
        [key]: { ...prev.cells[key], ...patch },
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateReport(reportId, { template });
      message.success('模板已保存');
    } catch {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const addRow = () => setTemplate((p) => ({ ...p, rows: p.rows + 1 }));
  const addCol = () => setTemplate((p) => ({ ...p, cols: p.cols + 1 }));

  const setDataRowTemplate = () => {
    if (!selected) {
      message.warning('请先选中一行作为动态数据行');
      return;
    }
    setTemplate((p) => ({ ...p, dataRowTemplate: selected.r }));
    message.success(`第 ${selected.r + 1} 行已设为动态数据行`);
  };

  const saveChart = async () => {
    const values = await chartForm.validateFields();
    const chart: ReportChart = {
      id: values.id || `chart_${Date.now()}`,
      type: values.type,
      title: values.title,
      categoryField: values.categoryField,
      valueField: values.valueField,
      height: values.height || 280,
    };
    setTemplate((p) => ({
      ...p,
      charts: [...(p.charts || []).filter((c) => c.id !== chart.id), chart],
    }));
    setChartDrawer(false);
    chartForm.resetFields();
    message.success('图表配置已添加');
  };

  const removeChart = (chartId: string) => {
    setTemplate((p) => ({
      ...p,
      charts: (p.charts || []).filter((c) => c.id !== chartId),
    }));
  };

  if (loading) return <Card loading style={{ margin: 16 }} />;

  return (
    <div style={{ padding: 16 }}>
      <div className="report-toolbar">
        <Space wrap>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/report')}>
            返回列表
          </Button>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
            保存模板
          </Button>
          <Button onClick={() => navigate(`/report/preview/${reportId}`)}>预览与导出</Button>
          <Button onClick={addRow}>+ 行</Button>
          <Button onClick={addCol}>+ 列</Button>
          <Button onClick={setDataRowTemplate}>设为动态数据行</Button>
          <Button icon={<PlusOutlined />} onClick={() => setChartDrawer(true)}>
            添加图表
          </Button>
        </Space>
        <div style={{ marginTop: 8, color: '#666' }}>
          设计：{reportName} — 点击单元格编辑；黄底为字段绑定；绿底行为动态数据模板行
        </div>
      </div>

      <div className="report-designer">
        <ReportGrid
          mode="design"
          template={template}
          selected={selected}
          onSelect={(r, c) => setSelected({ r, c })}
          dataRowTemplate={template.dataRowTemplate}
        />

        <div className="report-panel">
          <h4 style={{ marginTop: 0 }}>单元格属性</h4>
          {selected ? (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                位置：第 {selected.r + 1} 行，第 {selected.c + 1} 列
              </div>
              <Input
                placeholder="静态文本"
                value={selectedCell?.value ?? ''}
                onChange={(e) => updateCell({ value: e.target.value })}
              />
              <Input
                placeholder="绑定字段 key（如 product、amount）"
                value={selectedCell?.field ?? ''}
                onChange={(e) => updateCell({ field: e.target.value || undefined })}
                addonBefore="字段"
              />
              <Checkbox
                checked={!!selectedCell?.isRowField}
                onChange={(e) => updateCell({ isRowField: e.target.checked })}
              >
                动态行字段（随数据行扩展）
              </Checkbox>
              <Checkbox
                checked={!!selectedCell?.isRowTemplate}
                onChange={(e) => updateCell({ isRowTemplate: e.target.checked })}
              >
                序号列（自动 1,2,3…）
              </Checkbox>
              <Checkbox
                checked={!!selectedCell?.style?.bold}
                onChange={(e) =>
                  updateCell({ style: { ...selectedCell?.style, bold: e.target.checked } })
                }
              >
                加粗
              </Checkbox>
              <Select
                placeholder="对齐"
                allowClear
                style={{ width: '100%' }}
                value={selectedCell?.style?.align}
                onChange={(v) => updateCell({ style: { ...selectedCell?.style, align: v } })}
                options={[
                  { label: '左', value: 'left' },
                  { label: '中', value: 'center' },
                  { label: '右', value: 'right' },
                ]}
              />
              <Input
                placeholder="背景色 #fafafa"
                value={selectedCell?.style?.bgColor ?? ''}
                onChange={(e) =>
                  updateCell({ style: { ...selectedCell?.style, bgColor: e.target.value } })
                }
              />
              <Row gutter={8}>
                <Col span={12}>
                  <InputNumber
                    min={1}
                    max={10}
                    placeholder="合并列"
                    style={{ width: '100%' }}
                    value={selectedCell?.merge?.colspan}
                    onChange={(v) =>
                      updateCell({
                        merge: {
                          rowspan: selectedCell?.merge?.rowspan || 1,
                          colspan: v || 1,
                        },
                      })
                    }
                  />
                </Col>
                <Col span={12}>
                  <InputNumber
                    min={1}
                    max={10}
                    placeholder="合并行"
                    style={{ width: '100%' }}
                    value={selectedCell?.merge?.rowspan}
                    onChange={(v) =>
                      updateCell({
                        merge: {
                          rowspan: v || 1,
                          colspan: selectedCell?.merge?.colspan || 1,
                        },
                      })
                    }
                  />
                </Col>
              </Row>
            </Space>
          ) : (
            <p style={{ color: '#999' }}>点击左侧表格单元格进行编辑</p>
          )}

          <h4>图表配置</h4>
          {(template.charts || []).length === 0 ? (
            <p style={{ color: '#999', fontSize: 12 }}>暂无图表</p>
          ) : (
            (template.charts || []).map((ch) => (
              <div
                key={ch.id}
                style={{
                  marginBottom: 8,
                  padding: 8,
                  background: '#fff',
                  borderRadius: 4,
                  fontSize: 12,
                }}
              >
                <div>{ch.title}</div>
                <div style={{ color: '#888' }}>
                  {ch.type} · {ch.categoryField} / {ch.valueField}
                </div>
                <Button type="link" danger size="small" onClick={() => removeChart(ch.id)}>
                  删除
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <Drawer title="添加图表" open={chartDrawer} onClose={() => setChartDrawer(false)} width={400}>
        <Form form={chartForm} layout="vertical" onFinish={saveChart}>
          <Form.Item name="title" label="图表标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="类型" initialValue="bar" rules={[{ required: true }]}>
            <Select options={CHART_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="categoryField"
            label="分类字段（X轴/饼图项）"
            rules={[{ required: true }]}
          >
            <Input placeholder="如 product" />
          </Form.Item>
          <Form.Item name="valueField" label="数值字段" rules={[{ required: true }]}>
            <Input placeholder="如 amount" />
          </Form.Item>
          <Form.Item name="height" label="高度" initialValue={280}>
            <InputNumber min={200} max={500} style={{ width: '100%' }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            确定
          </Button>
        </Form>
      </Drawer>
    </div>
  );
};

export default ReportDesign;
