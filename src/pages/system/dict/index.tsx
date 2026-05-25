import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import './index.css';
import FormRemark from '../../../components/FormRemark';
import {
  createDictData,
  createDictType,
  deleteDictData,
  deleteDictType,
  getDictData,
  getDictTypes,
  updateDictData,
  updateDictType,
  type DictData,
  type DictType,
} from '../../../api/dict';

const statusOptions = [
  { value: 1, label: '正常' },
  { value: 0, label: '停用' },
];

const SystemDict = () => {
  const [typeForm] = Form.useForm();
  const [dataForm] = Form.useForm();

  const [view, setView] = useState<'types' | 'data'>('types');
  const [types, setTypes] = useState<DictType[]>([]);
  const [dataList, setDataList] = useState<DictData[]>([]);
  const [currentType, setCurrentType] = useState<DictType | null>(null);
  const [typeLoading, setTypeLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [dataModalOpen, setDataModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<DictType | null>(null);
  const [editingData, setEditingData] = useState<DictData | null>(null);
  const [saving, setSaving] = useState(false);

  const loadTypes = useCallback(async () => {
    setTypeLoading(true);
    try {
      const res = await getDictTypes();
      if (res.data.code === 200) {
        setTypes(res.data.data ?? []);
      } else {
        message.error(res.data.message || '加载字典类型失败');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '加载字典类型失败');
    } finally {
      setTypeLoading(false);
    }
  }, []);

  const loadData = useCallback(async (dictType: string) => {
    setDataLoading(true);
    try {
      const res = await getDictData({ dictType });
      if (res.data.code === 200) {
        setDataList(res.data.data ?? []);
      } else {
        message.error(res.data.message || '加载字典数据失败');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '加载字典数据失败');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'types') {
      loadTypes();
    }
  }, [view, loadTypes]);

  useEffect(() => {
    if (view === 'data' && currentType) {
      loadData(currentType.dict_type);
    }
  }, [view, currentType, loadData]);

  const enterDataView = (record: DictType) => {
    setCurrentType(record);
    setView('data');
  };

  const backToTypes = () => {
    setView('types');
    setCurrentType(null);
    setDataList([]);
  };

  const openTypeCreate = () => {
    setEditingType(null);
    typeForm.setFieldsValue({ dict_name: '', dict_type: '', status: 1, remark: '' });
    setTypeModalOpen(true);
  };

  const openTypeEdit = (record: DictType) => {
    setEditingType(record);
    typeForm.setFieldsValue(record);
    setTypeModalOpen(true);
  };

  const submitType = async () => {
    const values = await typeForm.validateFields();
    setSaving(true);
    try {
      const res = editingType
        ? await updateDictType(editingType.id, values)
        : await createDictType(values);
      if (res.data.code === 200) {
        message.success(editingType ? '更新成功' : '创建成功');
        setTypeModalOpen(false);
        loadTypes();
        if (currentType?.id === editingType?.id) {
          setCurrentType(res.data.data);
        }
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

  const handleDeleteType = async (record: DictType) => {
    try {
      const res = await deleteDictType(record.id);
      if (res.data.code === 200) {
        message.success('删除成功');
        if (currentType?.id === record.id) backToTypes();
        else loadTypes();
      } else {
        message.error(res.data.message || '删除失败');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '删除失败');
    }
  };

  const openDataCreate = () => {
    if (!currentType) return;
    setEditingData(null);
    dataForm.setFieldsValue({
      dict_type: currentType.dict_type,
      dict_label: '',
      dict_value: '',
      sort_order: 0,
      status: 1,
      remark: '',
    });
    setDataModalOpen(true);
  };

  const openDataEdit = (record: DictData) => {
    setEditingData(record);
    dataForm.setFieldsValue(record);
    setDataModalOpen(true);
  };

  const submitData = async () => {
    const values = await dataForm.validateFields();
    setSaving(true);
    try {
      const res = editingData
        ? await updateDictData(editingData.id, values)
        : await createDictData(values);
      if (res.data.code === 200) {
        message.success(editingData ? '更新成功' : '创建成功');
        setDataModalOpen(false);
        if (currentType) loadData(currentType.dict_type);
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

  const handleDeleteData = async (id: number) => {
    try {
      const res = await deleteDictData(id);
      if (res.data.code === 200) {
        message.success('删除成功');
        if (currentType) loadData(currentType.dict_type);
      } else {
        message.error(res.data.message || '删除失败');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '删除失败');
    }
  };

  const typeColumns: ColumnsType<DictType> = [
    { title: '字典名称', dataIndex: 'dict_name', width: 160 },
    { title: '字典编码', dataIndex: 'dict_type', width: 180 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: number) =>
        v === 1 ? <Tag color="success">正常</Tag> : <Tag>停用</Tag>,
    },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
    {
      title: '操作',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => enterDataView(record)}>
            字典数据
          </Button>
          <Button type="link" size="small" onClick={() => openTypeEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="删除类型将同时删除其下所有字典数据"
            onConfirm={() => handleDeleteType(record)}
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const dataColumns: ColumnsType<DictData> = [
    { title: '显示标签', dataIndex: 'dict_label', width: 140 },
    { title: '字典值', dataIndex: 'dict_value', width: 120 },
    { title: '排序', dataIndex: 'sort_order', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: number) =>
        v === 1 ? <Tag color="success">正常</Tag> : <Tag>停用</Tag>,
    },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => openDataEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDeleteData(record.id)}>
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (view === 'data' && currentType) {
    return (
      <div className="page-container dict-page">
        <div className="dict-sub-header">
          <Button icon={<ArrowLeftOutlined />} onClick={backToTypes}>
            返回
          </Button>
          <div className="dict-sub-title">
            <span className="dict-sub-title-main">字典数据</span>
            <span className="dict-sub-title-sub">
              {currentType.dict_name}（{currentType.dict_type}）
            </span>
          </div>
        </div>

        <Card size="small" variant="outlined">
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" onClick={openDataCreate}>
              新增数据
            </Button>
            <Button onClick={() => loadData(currentType.dict_type)}>刷新</Button>
          </Space>
          <Table<DictData>
            rowKey="id"
            loading={dataLoading}
            columns={dataColumns}
            dataSource={dataList}
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </Card>

        <Modal
          title={editingData ? '编辑字典数据' : '新增字典数据'}
          open={dataModalOpen}
          onOk={submitData}
          onCancel={() => setDataModalOpen(false)}
          confirmLoading={saving}
          destroyOnClose
          width={480}
          centered
        >
          <Form form={dataForm} layout="vertical" requiredMark className="dict-form-modal">
            <Form.Item name="dict_type" label="字典编码">
              <Input disabled />
            </Form.Item>
            <Form.Item
              name="dict_label"
              label="显示标签"
              rules={[{ required: true, message: '请输入显示标签' }]}
            >
              <Input placeholder="如：男" />
            </Form.Item>
            <Form.Item
              name="dict_value"
              label="字典值"
              rules={[{ required: true, message: '请输入字典值' }]}
            >
              <Input placeholder="如：0" />
            </Form.Item>
            <Form.Item name="sort_order" label="排序">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="status" label="状态" rules={[{ required: true }]}>
              <Select options={statusOptions} />
            </Form.Item>
            <FormRemark placeholder="可选" />
          </Form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="page-container dict-page">
      <Card size="small" variant="outlined">
        <div className="section-title">字典类型</div>
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={openTypeCreate}>
            新增类型
          </Button>
          <Button onClick={loadTypes}>刷新</Button>
        </Space>
        <Table<DictType>
          rowKey="id"
          loading={typeLoading}
          columns={typeColumns}
          dataSource={types}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      <Modal
        title={editingType ? '编辑字典类型' : '新增字典类型'}
        open={typeModalOpen}
        onOk={submitType}
        onCancel={() => setTypeModalOpen(false)}
        confirmLoading={saving}
        destroyOnClose
        width={480}
        centered
      >
        <Form form={typeForm} layout="vertical" requiredMark className="dict-form-modal">
          <Form.Item
            name="dict_name"
            label="字典名称"
            rules={[{ required: true, message: '请输入字典名称' }]}
          >
            <Input placeholder="如：用户性别" />
          </Form.Item>
          <Form.Item
            name="dict_type"
            label="字典编码"
            rules={[{ required: true, message: '请输入字典编码' }]}
          >
            <Input placeholder="如：sys_user_sex" disabled={!!editingType} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select options={statusOptions} />
          </Form.Item>
          <FormRemark placeholder="可选" />
        </Form>
      </Modal>
    </div>
  );
};

export default SystemDict;
