import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Space, Spin, message } from 'antd';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  EditOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  getReport,
  getReportData,
  getReportExcelExportUrl,
  previewReport,
} from '../../api/report';
import ReportGrid from './components/ReportGrid';
import type { ReportChart, ReportDataPayload, ReportRecord, RenderedReport } from './types';
import './report.css';

const buildChartOption = (chart: ReportChart, data: ReportDataPayload) => {
  const rows = data.rows || [];
  const categories = rows.map((r) => String(r[chart.categoryField] ?? ''));
  const values = rows.map((r) => Number(r[chart.valueField]) || 0);

  if (chart.type === 'pie') {
    return {
      title: { text: chart.title, left: 'center' },
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'pie',
          radius: '55%',
          data: categories.map((name, i) => ({ name, value: values[i] })),
        },
      ],
    };
  }

  return {
    title: { text: chart.title },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: categories },
    yAxis: { type: 'value' },
    series: [{ type: chart.type, data: values, name: chart.valueField }],
  };
};

const exportClientExcel = (
  rendered: RenderedReport,
  filename: string,
) => {
  const ws = XLSX.utils.aoa_to_sheet(rendered.grid);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '报表');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), `${filename}.xlsx`);
};

const ReportPreview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reportId = Number(id);
  const chartRefs = useRef<Record<string, ReactECharts | null>>({});

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportRecord | null>(null);
  const [data, setData] = useState<ReportDataPayload | null>(null);
  const [rendered, setRendered] = useState<RenderedReport | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [reportRes, dataRes, previewRes] = await Promise.all([
        getReport(reportId),
        getReportData(reportId),
        previewReport(reportId),
      ]);
      if (reportRes.data.code === 200) setReport(reportRes.data.data);
      if (dataRes.data.code === 200) setData(dataRes.data.data);
      if (previewRes.data.code === 200) setRendered(previewRes.data.data?.rendered || null);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '加载预览失败');
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    load();
  }, [load]);

  const downloadServerExcel = () => {
    const url = getReportExcelExportUrl(reportId);
    const token = localStorage.getItem('token');
    const a = document.createElement('a');
    a.href = token ? `${url}?t=${Date.now()}` : url;
    a.target = '_blank';
    a.rel = 'noopener';
    if (token) {
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.blob())
        .then((blob) => {
          saveAs(blob, `${report?.reportName || 'report'}.xlsx`);
        })
        .catch(() => message.error('导出失败'));
      return;
    }
    a.click();
  };

  const downloadClientExcel = () => {
    if (!rendered || !report) return;
    exportClientExcel(rendered, report.reportName || report.reportCode);
    message.success('已导出 Excel（前端）');
  };

  const downloadChartPng = (chartId: string, title: string) => {
    const inst = chartRefs.current[chartId]?.getEchartsInstance();
    if (!inst) return;
    const url = inst.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' });
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || chartId}.png`;
    a.click();
    message.success('图表已导出 PNG');
  };

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const charts = rendered?.charts || report?.template?.charts || [];

  return (
    <div style={{ padding: 16 }}>
      <div className="report-toolbar">
        <Space wrap>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/report')}>
            返回
          </Button>
          <Button icon={<EditOutlined />} onClick={() => navigate(`/report/design/${reportId}`)}>
            编辑模板
          </Button>
          <Button icon={<ReloadOutlined />} onClick={load}>
            刷新数据
          </Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={downloadServerExcel}>
            导出 Excel（服务端）
          </Button>
          <Button icon={<DownloadOutlined />} onClick={downloadClientExcel}>
            导出 Excel（前端）
          </Button>
        </Space>
        <div style={{ marginTop: 8, color: '#666' }}>
          {report?.reportName} — 数据由接口 <code>/api/report/{reportId}/data</code> 填充
        </div>
      </div>

      <Card title="报表预览" size="small">
        {rendered && (
          <ReportGrid mode="preview" rendered={rendered} dataRowTemplate={undefined} />
        )}
      </Card>

      {charts.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3>图表</h3>
          {data &&
            charts.map((ch) => (
              <div key={ch.id} className="report-chart-box">
                <Space style={{ marginBottom: 8 }}>
                  <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => downloadChartPng(ch.id, ch.title)}
                  >
                    导出 PNG
                  </Button>
                </Space>
                <ReactECharts
                  ref={(el) => {
                    chartRefs.current[ch.id] = el;
                  }}
                  option={buildChartOption(ch, data)}
                  style={{ height: ch.height || 280 }}
                />
              </div>
            ))}
        </div>
      )}

      {data && (
        <Card title="接口返回数据（调试）" size="small" style={{ marginTop: 16 }}>
          <pre style={{ margin: 0, fontSize: 12, maxHeight: 240, overflow: 'auto' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
};

export default ReportPreview;
