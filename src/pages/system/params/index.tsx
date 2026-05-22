import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import FormRemark from '../../../components/FormRemark';
import {
  createParam,
  deleteParam,
  getParamList,
  updateParam,
  type SysParam,
} from '../../../api/param';

const TYPE_MAP: Record<number, string> = {
  1: '文本',
  2: '数字',
  3: '开关',
  4: 'JSON',
};

const statusOptions = [
  { value: 1, label: '正常' },
  { value: 0, label: '停用' },
];

const defaultForm = {
  param_name: '',
  param_key: '',
  param_value: '',
  param_type: 1,
  sort_order: 0,
  status: 1,
  remark: '',
};

const SystemParams = () => {
  const [form] = Form.useForm();
  const [list, setList] = useState<SysParam[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<number | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<SysParam | null>(null);
  const paramType = Form.useWatch('param_type', form);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getParamList({
        keyword: keyword || undefined,
        status: filterStatus,
      });
      if (res.data.code === 200) {
        setList(res.data.data ?? []);
      } else {
        message.error(res.data.message || '加载失败');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '加载参数失败');
    } finally {
      setLoading(false);
    }
  }, [keyword, filterStatus]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (record: SysParam) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      param_value: record.param_value ?? '',
      remark: record.remark ?? '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      param_value:
        values.param_type === 3
          ? values.param_value
            ? '1'
            : '0'
          : String(values.param_value ?? ''),
      remark: values.remark || null,
    };

    setSaving(true);
    try {
      const res = editing
        ? await updateParam(editing.id, payload)
        : await createParam(payload);
      if (res.data.code === 200) {
        message.success(editing ? '更新成功' : '创建成功');
        setModalOpen(false);
        loadList();
      } else {
        message.error(res.data.message || '保存失败');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await deleteParam(id);
      if (res.data.code === 200) {
        message.success('删除成功');
        loadList();
      } else {
        message.error(res.data.message || '删除失败');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '删除失败');
    }
  };

  const renderValue = (record: SysParam) => {
    if (record.param_type === 3) {
      return record.param_value === '1' ? (
        <Tag color="success">开启</Tag>
      ) : (
        <Tag>关闭</Tag>
      );
    }
    const text = record.param_value ?? '';
    if (record.param_type === 4) {
      return (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {text.length > 60 ? `${text.slice(0, 60)}...` : text}
        </span>
      );
    }
    return text.length > 40 ? `${text.slice(0, 40)}...` : text;
  };

  const columns: ColumnsType<SysParam> = [
    { title: '参数名称', dataIndex: 'param_name', width: 140 },
    { title: '参数键', dataIndex: 'param_key', width: 180, ellipsis: true },
    {
      title: '参数值',
      key: 'param_value',
      ellipsis: true,
      render: (_, record) => renderValue(record),
    },
    {
      title: '类型',
      dataIndex: 'param_type',
      width: 80,
      render: (t: number) => TYPE_MAP[t] ?? t,
    },
    { title: '排序', dataIndex: 'sort_order', width: 70 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (s: number) =>
        s === 1 ? <Tag color="success">正常</Tag> : <Tag>停用</Tag>,
    },
    { title: '备注', dataIndex: 'remark', width: 120, ellipsis: true },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该参数？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="搜索名称 / 键 / 值"
          allowClear
          style={{ width: 240 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={loadList}
        />
        <Select
          placeholder="状态"
          allowClear
          style={{ width: 120 }}
          options={statusOptions}
          value={filterStatus}
          onChange={setFilterStatus}
        />
        <Button type="primary" onClick={openCreate}>
          新增参数
        </Button>
        <Button onClick={loadList}>刷新</Button>
      </Space>

      <Table<SysParam>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={list}
        scroll={{ x: 1000 }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />

      <Modal
        title={editing ? '编辑参数' : '新增参数'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        destroyOnClose
        width={720}
        centered
        styles={{ body: { padding: '20px 24px 8px', overflow: 'visible', maxHeight: 'none' } }}
      >
        <Form form={form} layout="vertical" requiredMark preserve={false}>
          <Row gutter={[24, 4]}>
            <Col span={12}>
              <Form.Item
                name="param_name"
                label="参数名称"
                rules={[{ required: true, message: '请输入参数名称' }]}
              >
                <Input placeholder="如：系统名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="param_key"
                label="参数键"
                rules={[{ required: true, message: '请输入参数键' }]}
                extra="唯一，如 sys.name"
              >
                <Input placeholder="sys.name" disabled={!!editing} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="param_type" label="参数类型" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 1, label: '文本' },
                    { value: 2, label: '数字' },
                    { value: 3, label: '开关' },
                    { value: 4, label: 'JSON' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select options={statusOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sort_order" label="排序">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              {paramType === 3 ? (
                <Form.Item
                  name="param_value"
                  label="参数值"
                  valuePropName="checked"
                  getValueFromEvent={(c) => (c ? '1' : '0')}
                  getValueProps={(v) => ({ checked: v === '1' || v === 1 })}
                >
                  <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                </Form.Item>
              ) : null}
            </Col>
            {paramType !== 3 && (
              <Col span={24}>
                <Form.Item
                  name="param_value"
                  label="参数值"
                  rules={paramType === 2 ? [{ required: true, message: '请输入数字' }] : []}
                >
                  {paramType === 4 ? (
                    <Input.TextArea rows={4} placeholder='{"key": "value"}' />
                  ) : (
                    <Input.TextArea rows={3} placeholder="参数值" />
                  )}
                </Form.Item>
              </Col>
            )}
            <Col span={24}>
              <FormRemark placeholder="可选" />
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default SystemParams;
