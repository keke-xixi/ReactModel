import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Col,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import './index.css';
import {
  createMenu,
  deleteMenu,
  getMenuList,
  updateMenu,
  type MenuFormValues,
  type MenuRecord,
} from '../../../api/menu';

const TYPE_MAP: Record<number, { label: string; color: string }> = {
  1: { label: '目录', color: 'blue' },
  2: { label: '页面', color: 'green' },
  3: { label: '按钮', color: 'orange' },
};

const defaultForm: MenuFormValues = {
  parent_id: 0,
  type: 2,
  label: '',
  menu_key: '',
  path: '',
  icon: '',
  sort_order: 0,
  status: 1,
  reserved1: '',
  reserved2: '',
};

function toFormValues(record: MenuRecord): MenuFormValues {
  return {
    parent_id: Number(record.parent_id) || 0,
    type: Number(record.type) || 2,
    label: record.label ?? '',
    menu_key: record.menu_key ?? '',
    path: record.path ?? '',
    icon: record.icon ?? '',
    sort_order: Number(record.sort_order) || 0,
    status: Number(record.status) ?? 1,
    reserved1: record.reserved1 ?? '',
    reserved2: record.reserved2 ?? '',
  };
}

const SystemMenu = () => {
  const [form] = Form.useForm<MenuFormValues>();
  const [list, setList] = useState<MenuRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<MenuRecord | null>(null);

  const parentLabelMap = useMemo(() => {
    const map = new Map<number, string>();
    map.set(0, '顶级');
    list.forEach((item) => map.set(item.id, item.label));
    return map;
  }, [list]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMenuList();
      if (res.data.code === 200) {
        setList(res.data.data ?? []);
      } else {
        message.error(res.data.message || '加载失败');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '加载菜单失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const fillForm = (record: MenuRecord | null) => {
    form.resetFields();
    form.setFieldsValue(record ? toFormValues(record) : defaultForm);
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (record: MenuRecord) => {
    setEditing(record);
    setModalOpen(true);
  };

  const handleModalAfterOpen = (open: boolean) => {
    if (open) fillForm(editing);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload: MenuFormValues = {
      ...values,
      path: values.path || null,
      icon: values.icon || null,
      reserved1: values.reserved1 || null,
      reserved2: values.reserved2 || null,
    };

    setSaving(true);
    try {
      const res = editing
        ? await updateMenu(editing.id, payload)
        : await createMenu(payload);

      if (res.data.code === 200) {
        message.success(editing ? '更新成功' : '创建成功');
        setModalOpen(false);
        loadList();
      } else {
        message.error(res.data.message || '操作失败');
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
      const res = await deleteMenu(id);
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

  const parentOptions = useMemo(
    () =>
      [{ value: 0, label: '顶级' }].concat(
        list
          .filter((item) => !editing || item.id !== editing.id)
          .map((item) => ({
            value: item.id,
            label: `${item.label}（${item.menu_key}）`,
          }))
      ),
    [list, editing]
  );

  const columns: ColumnsType<MenuRecord> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '名称', dataIndex: 'label', width: 120 },
    { title: 'Key', dataIndex: 'menu_key', width: 140 },
    {
      title: '父级',
      dataIndex: 'parent_id',
      width: 100,
      render: (pid: number) => parentLabelMap.get(pid) ?? pid,
    },
    { title: '级别', dataIndex: 'level', width: 70 },
    {
      title: '类型',
      dataIndex: 'type',
      width: 80,
      render: (type: number) => {
        const t = TYPE_MAP[type] ?? { label: String(type), color: 'default' };
        return <Tag color={t.color}>{t.label}</Tag>;
      },
    },
    { title: '路径', dataIndex: 'path', ellipsis: true },
    { title: '排序', dataIndex: 'sort_order', width: 70 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status: number) =>
        status === 1 ? <Tag color="success">显示</Tag> : <Tag>隐藏</Tag>,
    },
    { title: '预留1', dataIndex: 'reserved1', width: 90, ellipsis: true },
    { title: '预留2', dataIndex: 'reserved2', width: 90, ellipsis: true },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该菜单？"
            description="有子菜单时需先删子项"
            onConfirm={() => handleDelete(record.id)}
          >
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
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={openCreate}>
          新增菜单
        </Button>
        <Button onClick={loadList}>刷新</Button>
      </Space>

      <Table<MenuRecord>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={list}
        scroll={{ x: 1100 }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />

      <Modal
        title={editing ? '编辑菜单' : '新增菜单'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        afterOpenChange={handleModalAfterOpen}
        confirmLoading={saving}
        destroyOnClose
        width={720}
        centered
        styles={{
          body: {
            padding: '20px 24px 8px',
            overflow: 'visible',
            maxHeight: 'none',
          },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          size="middle"
          requiredMark
          className="menu-form-modal"
        >
          <Row gutter={[24, 4]}>
            <Col span={12}>
              <Form.Item
                name="parent_id"
                label="父级菜单"
                rules={[{ required: true, message: '请选择父级' }]}
              >
                <Select options={parentOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="label"
                label="菜单名称"
                rules={[{ required: true, message: '请输入菜单名称' }]}
              >
                <Input placeholder="如：系统参数" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="menu_key"
                label="菜单 Key"
                rules={[{ required: true, message: '请输入唯一 key' }]}
              >
                <Input
                  placeholder="如：system-menu"
                  disabled={!!editing}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
                <Select
                  options={[
                    { value: 1, label: '目录' },
                    { value: 2, label: '页面' },
                    { value: 3, label: '按钮' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="path" label="路由路径">
                <Input placeholder="/system/menu，目录可留空" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="icon" label="图标">
                <Input placeholder="可选" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sort_order" label="排序">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
                <Select
                  options={[
                    { value: 1, label: '显示' },
                    { value: 0, label: '隐藏' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="reserved1" label="预留字段1">
                <Input placeholder="可选" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="reserved2" label="预留字段2">
                <Input placeholder="可选" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default SystemMenu;
