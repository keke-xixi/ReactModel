import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Col,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  BarChartOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import FormRemark from '../../components/FormRemark';
import {
  createReport,
  deleteReport,
  getReportList,
  updateReport,
} from '../../api/report';
import type { ReportRecord } from './types';
import { DEFAULT_TEMPLATE, REPORT_TYPE_OPTIONS } from './types';

type SearchForm = { reportName?: string; reportCode?: string; reportType?: string };

type EditForm = {
  reportName: string;
  reportCode: string;
  reportType: string;
  remark?: string;
};

const ReportList = () => {
  const navigate = useNavigate();
  const [searchForm] = Form.useForm<SearchForm>();
  const [editForm] = Form.useForm<EditForm>();
  const [list, setList] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<ReportRecord | null>(null);

  const fetchList = useCallback(async (params?: SearchForm) => {
    setLoading(true);
    try {
      const res = await getReportList(params);
      if (res.data.code === 200) {
        setList(res.data.data ?? []);
      } else {
        message.error(res.data.message || '加载失败');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '加载报表列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openAdd = () => {
    setEditing(null);
    editForm.resetFields();
    editForm.setFieldsValue({ reportType: 'general' });
    setModalOpen(true);
  };

  const openEditMeta = (record: ReportRecord) => {
    setEditing(record);
    editForm.setFieldsValue({
      reportName: record.reportName,
      reportCode: record.reportCode,
      reportType: record.reportType,
      remark: record.remark ?? '',
    });
    setModalOpen(true);
  };

  const handleSaveMeta = async () => {
    const values = await editForm.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await updateReport(editing.id, values);
        message.success('更新成功');
      } else {
        const res = await createReport({
          ...values,
          template: DEFAULT_TEMPLATE,
        });
        if (res.data.code !== 200) {
          message.error(res.data.message || '创建失败');
          return;
        }
        message.success('创建成功，可进入设计器制作表格');
        const newId = res.data.data?.id;
        if (newId) navigate(`/report/design/${newId}`);
      }
      setModalOpen(false);
      fetchList();
    } catch {
      message.error(editing ? '更新失败' : '创建失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteReport(id);
      message.success('已删除');
      fetchList(searchForm.getFieldsValue());
    } catch {
      message.error('删除失败');
    }
  };

  const columns: ColumnsType<ReportRecord> = [
    { title: '报表名称', dataIndex: 'reportName', key: 'reportName' },
    { title: '报表编码', dataIndex: 'reportCode', key: 'reportCode' },
    {
      title: '类型',
      dataIndex: 'reportType',
      key: 'reportType',
      render: (v) => REPORT_TYPE_OPTIONS.find((o) => o.value === v)?.label || v,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (s) => (Number(s) === 1 ? <Tag color="green">启用</Tag> : <Tag>停用</Tag>),
    },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
    {
      title: '操作',
      key: 'actions',
      width: 320,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/report/design/${record.id}`)}
          >
            设计
          </Button>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/report/preview/${record.id}`)}
          >
            预览
          </Button>
          <Button type="link" onClick={() => openEditMeta(record)}>
            属性
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="zForm">
        <Form
          form={searchForm}
          layout="horizontal"
          onFinish={(v) => fetchList(v)}
          autoComplete="off"
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="reportName" label="名称">
                <Input placeholder="报表名称" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="reportCode" label="编码">
                <Input placeholder="报表编码" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="reportType" label="类型">
                <Select options={REPORT_TYPE_OPTIONS} allowClear placeholder="全部" />
              </Form.Item>
            </Col>
            <Col span={6} style={{ textAlign: 'right' }}>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  查询
                </Button>
                <Button
                  onClick={() => {
                    searchForm.resetFields();
                    fetchList();
                  }}
                >
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </div>

      <div className="zTable">
        <div className="table-action" style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            新建报表
          </Button>
          <span style={{ marginLeft: 12, color: '#888', fontSize: 13 }}>
            <BarChartOutlined /> 像 Excel 一样设计表格，绑定字段后由接口填充并导出
          </span>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={list}
          columns={columns}
          scroll={{ y: 400 }}
        />
      </div>

      <Modal
        title={editing ? '编辑报表属性' : '新建报表'}
        open={modalOpen}
        onOk={handleSaveMeta}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        destroyOnClose
        afterOpenChange={(open) => {
          if (open && editing) {
            editForm.setFieldsValue({
              reportName: editing.reportName,
              reportCode: editing.reportCode,
              reportType: editing.reportType,
              remark: editing.remark ?? '',
            });
          }
        }}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="reportName"
            label="报表名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="reportCode"
            label="报表编码"
            rules={[{ required: true, message: '请输入编码' }]}
          >
            <Input disabled={!!editing} placeholder="唯一，如 sales_monthly" />
          </Form.Item>
          <Form.Item name="reportType" label="类型" rules={[{ required: true }]}>
            <Select options={REPORT_TYPE_OPTIONS} />
          </Form.Item>
          <FormRemark />
        </Form>
      </Modal>
    </div>
  );
};

export default ReportList;
