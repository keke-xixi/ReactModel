import { useEffect, useState } from 'react';
import { Button, Form, Input, Table, Row, Col, Space, Modal, message, Select } from 'antd';

type FieldType = {
  reportName?: string;
  reportCode?: string;
};

type RecordType = {
  key: string;
  reportName: string;
  reportCode: string;
  reportType: string;
  remark?: string;
  json?: string;
};

const DB_NAME = 'report-db';
const STORE_NAME = 'report-list';
const DB_VERSION = 1;
const SESSION_KEY = 'report-list-session';

const typeSelectOpt = [
  { label: '测试报表', value: 'test' },
]

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const loadFromIndexedDB = async (): Promise<RecordType[]> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as RecordType[]);
    request.onerror = () => reject(request.error);
  });
};

const saveToIndexedDB = async (data: RecordType[]) => {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const clearRequest = store.clear();
    clearRequest.onsuccess = () => {
      data.forEach(record => store.put(record));
    };
    clearRequest.onerror = () => reject(clearRequest.error);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const saveSessionData = (data: RecordType[]) => {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
};

const getSessionData = (): RecordType[] | null => {
  const content = sessionStorage.getItem(SESSION_KEY);
  if (!content) return null;
  try {
    return JSON.parse(content) as RecordType[];
  } catch {
    return null;
  }
};

const getInitialData = (): RecordType[] => [
  {
    key: '1',
    reportName: 'test',
    reportCode: 'test',
    reportType: 'test',
    remark: ''
  },
];

const Report = () => {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [dataSource, setDataSource] = useState<RecordType[]>([]);
  const [filteredData, setFilteredData] = useState<RecordType[]>([]);
  const [searchValues, setSearchValues] = useState<FieldType>({});
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RecordType | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [loadingQuery, setLoadingQuery] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const applySearch = (data: RecordType[], filters: FieldType) => {
    return data.filter(item => {
      const matchName = filters.reportName
        ? item.reportName.includes(filters.reportName)
        : true;
      const matchCode = filters.reportCode
        ? item.reportCode.includes(filters.reportCode)
        : true;
      return matchName && matchCode;
    });
  };

  const updateData = (nextData: RecordType[]) => {
    setDataSource(nextData);
    setFilteredData(applySearch(nextData, searchValues));
    saveSessionData(nextData);
  };

  const handleAdd = () => {
    setIsAddMode(true);
    setEditingRecord(null);
    editForm.resetFields();
    setIsEditModalVisible(true);
  };

  const handleEdit = (record: RecordType) => {
    setIsAddMode(false);
    setEditingRecord(record);
    editForm.setFieldsValue(record);
    setIsEditModalVisible(true);
  };

  // 删除
  const handleDelete = (key: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该项数据吗？',
      centered: true,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        try {
          setLoadingDelete(true);
          const nextData = dataSource.filter(item => item.key !== key);
          updateData(nextData);
        } finally {
          setTimeout(() => {
            message.success('删除成功，记得点击保存到 IndexedDB');
            setLoadingDelete(false);
          }, 500);
        }
      },
    });
  };

  const handleSaveRecord = async () => {
    try {
      // 校验表单 校验成功后返回表单数据、不成功可以直接报错、被try catch 抓到
      const values = await editForm.validateFields();
      if (isAddMode) {
        // 新增模式
        const nextKey = `${Date.now()}`; // 时间戳作为 id
        const newRecord: RecordType = {
          key: nextKey,
          ...values,
        };
        const nextData = [...dataSource, newRecord];
        updateData(nextData);
        message.success('新增成功，记得点击保存到 IndexedDB');
      } else {
        // 编辑模式
        if (!editingRecord) return;
        const nextData = dataSource.map(item =>
          item.key === editingRecord.key ? { ...item, ...values } : item,
        );
        updateData(nextData);
        message.success('编辑保存成功，记得点击保存到 IndexedDB');
      }
      setIsEditModalVisible(false);
      setEditingRecord(null);
      setIsAddMode(false);
    } catch (error) {
      console.error(error);
    }
  };

  // 查询
  const queryData = (values: FieldType) => {
    setLoadingQuery(true);
    try {
      setSearchValues(values);
      setFilteredData(applySearch(dataSource, values));
      message.success('查询完成');
    } finally {
      setTimeout(() => {
        setLoadingQuery(false);
      }, 500);
    }
  };

  // 重置
  const resetData = () => {
    form.resetFields();
    setSearchValues({});
    setFilteredData(dataSource);
    queryData({});
  };

  const handleSaveToIndexedDB = async () => {
    try {
      await saveToIndexedDB(dataSource);
      message.success('数据已保存到 IndexedDB');
    } catch (error) {
      console.error(error);
      message.error('保存到 IndexedDB 失败');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const sessionData = getSessionData();
      if (sessionData) {
        setDataSource(sessionData);
        setFilteredData(applySearch(sessionData, searchValues));
        return;
      }

      try {
        const idbData = await loadFromIndexedDB();
        if (idbData.length > 0) {
          setDataSource(idbData);
          setFilteredData(applySearch(idbData, searchValues));
          saveSessionData(idbData);
          return;
        }
      } catch (error) {
        console.error('IndexedDB 加载失败', error);
      }

      const initialData = getInitialData();
      setDataSource(initialData);
      setFilteredData(initialData);
      saveSessionData(initialData);
    };

    loadData();
  }, []);

  const columns = [
    {
      title: '报表名称',
      dataIndex: 'reportName',
      key: 'reportName',
    },
    {
      title: '报表编码',
      dataIndex: 'reportCode',
      key: 'reportCode',
    },
    {
      title: '报表类型',
      dataIndex: 'reportType',
      key: 'reportType',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    },
    {
      title: '操作',
      key: 'actions',
      // record 当前行行数据 相当于 row
      render: (_: any, record: RecordType) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.key)} loading={loadingDelete}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className='zForm'>
        <Form
          form={form}
          name="layout-multiple-horizontal"
          layout="horizontal"
          autoComplete="off"
          onFinish={queryData}
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item<FieldType>
                label="名称"
                name="reportName"
              >
                <Input placeholder="请输入名称" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item<FieldType>
                label="编码"
                name="reportCode"
              >
                <Input placeholder="请输入编码" />
              </Form.Item>
            </Col>
            <Col span={12} style={{ textAlign: 'right' }}>
              <Form.Item label={null}>
                <Button type="primary" htmlType="submit" style={{ marginRight: 8 }} loading={loadingQuery}>
                  查询
                </Button>
                <Button htmlType="button" onClick={resetData} loading={loadingQuery}>
                  重置
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>
      <div className='zTable'>
        <div className='table-action'>
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <Space>
                <Button type="primary" onClick={handleAdd}>
                  新增
                </Button>
                <Button type="default" onClick={handleSaveToIndexedDB}>
                  保存
                </Button>
              </Space>
            </Col>
          </Row>
        </div>
        <Table dataSource={filteredData} columns={columns} scroll={{ y: 400 }} />
      </div>

      <Modal
        title={isAddMode ? "新增报表" : "编辑报表"}
        open={isEditModalVisible}
        onOk={handleSaveRecord}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingRecord(null);
          setIsAddMode(false);
        }}
        okText="确认"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="reportName" label="报表名称" rules={[{ required: true, message: '请输入报表名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="reportCode" label="报表编码" rules={[{ required: true, message: '请输入报表编码' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="reportType" label="报表类型" rules={[{ required: true, message: '请选择报表类型' }]}>
            <Select options={typeSelectOpt} allowClear={true} />
          </Form.Item>
          <Form.Item name="remark" label="备注" rules={[{ required: false, message: '请输入备注' }]}>
            <Input.TextArea placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Report;
