import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Space,
  Tag,
  Upload,
  message,
} from 'antd';
import type { UploadProps } from 'antd';
import {
  CloudDownloadOutlined,
  DeleteOutlined,
  EditOutlined,
  InboxOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import './index.css';
import {
  deleteSoftware,
  getSoftwareCategories,
  getSoftwareList,
  updateSoftware,
  uploadSoftware,
  type SoftwareItem,
} from '../../api/software';
import { assetUrl } from '../../utils/assetUrl';

const { Dragger } = Upload;
const MAX_BYTES = 300 * 1024 * 1024;

const formatSize = (bytes: number) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const fileExt = (name: string) => {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toUpperCase() : 'APP';
};

type EditFormValues = {
  name: string;
  description: string;
  category: string;
  version: string;
};

const SoftwarePage = () => {
  const [list, setList] = useState<SoftwareItem[]>([]);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [keyword, setKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<SoftwareItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<EditFormValues>();

  const loadData = useCallback(async (kw?: string, category?: string | null) => {
    setLoading(true);
    try {
      const [listRes, catRes] = await Promise.all([
        getSoftwareList({ keyword: kw || undefined, category: category || undefined }),
        getSoftwareCategories(),
      ]);
      if (listRes.data.code === 200) setList(listRes.data.data ?? []);
      if (catRes.data.code === 200) setCategories(catRes.data.data ?? []);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(keyword, activeCategory);
  }, [loadData, keyword, activeCategory]);

  const totalSize = useMemo(() => list.reduce((s, i) => s + (i.file_size || 0), 0), [list]);

  const draggerProps: UploadProps = {
    name: 'file',
    multiple: true,
    showUploadList: false,
    disabled: uploading,
    beforeUpload: (file) => {
      if (file.size > MAX_BYTES) {
        message.error(`${file.name} 超过 300MB 限制`);
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      const f = file as File;
      setUploading(true);
      setUploadPercent(0);
      try {
        const res = await uploadSoftware(f, { name: f.name }, setUploadPercent);
        if (res.data.code === 200) {
          message.success(`${f.name} 上传成功`);
          onSuccess?.(res.data.data);
          loadData(keyword, activeCategory);
        } else {
          throw new Error(res.data.message || '上传失败');
        }
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } }; message?: string };
        message.error(err.response?.data?.message || err.message || '上传失败');
        onError?.(e as Error);
      } finally {
        setUploading(false);
        setUploadPercent(0);
      }
    },
  };

  const openEdit = (item: SoftwareItem) => {
    setEditing(item);
    form.setFieldsValue({
      name: item.name,
      description: item.description ?? '',
      category: item.category ?? '',
      version: item.version ?? '',
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editing) return;
    const values = await form.validateFields();
    setSaving(true);
    try {
      const res = await updateSoftware(editing.id, {
        ...values,
        description: values.description?.trim() || null,
        category: values.category?.trim() || null,
        version: values.version?.trim() || null,
      } as Partial<SoftwareItem>);
      if (res.data.code === 200) {
        message.success('已保存');
        setEditOpen(false);
        loadData(keyword, activeCategory);
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
      const res = await deleteSoftware(id);
      if (res.data.code === 200) {
        message.success('已删除');
        loadData(keyword, activeCategory);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '删除失败');
    }
  };

  return (
    <div className="software-page">
      <Card className="software-upload-card" bordered={false}>
        <Dragger {...draggerProps} className="software-dragger">
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">拖拽软件安装包到此处，或点击选择文件</p>
          <p className="ant-upload-hint">单文件不超过 300MB · 仅自己可见 · 支持 exe / zip / msi / dmg 等</p>
        </Dragger>
        {uploading && (
          <div className="software-upload-progress">
            <Progress percent={uploadPercent} status="active" />
          </div>
        )}
      </Card>

      <div className="software-toolbar">
        <Space wrap>
          <Input.Search
            placeholder="搜索名称、文件名、分类"
            allowClear
            style={{ width: 280 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={() => loadData(keyword, activeCategory)}
          />
          <Button icon={<ReloadOutlined />} loading={loading} onClick={() => loadData(keyword, activeCategory)}>
            刷新
          </Button>
        </Space>
        <span className="software-toolbar-meta">
          共 {list.length} 个 · 合计 {formatSize(totalSize)}
        </span>
      </div>

      {categories.length > 0 && (
        <div className="software-nav">
          <button
            type="button"
            className={`software-category-tab${activeCategory === null ? ' software-category-tab--active' : ''}`}
            onClick={() => setActiveCategory(null)}
          >
            全部
          </button>
          {categories.map((item) => (
            <button
              key={item.category}
              type="button"
              className={`software-category-tab${
                activeCategory === item.category ? ' software-category-tab--active' : ''
              }`}
              onClick={() => setActiveCategory(item.category)}
            >
              {item.category}
              <span className="software-category-tab-count">{item.count}</span>
            </button>
          ))}
        </div>
      )}

      {!loading && list.length === 0 ? (
        <Empty className="software-empty" description="暂无软件，拖入文件即可上传" />
      ) : (
        <Row gutter={[16, 16]} className="software-grid">
          {list.map((item) => (
            <Col key={item.id} xs={24} sm={12} lg={8} xl={6}>
              <Card className="software-item-card" size="small">
                <div className="software-item-ext">{fileExt(item.original_name)}</div>
                <div className="software-item-name" title={item.name}>
                  {item.name}
                </div>
                <div className="software-item-meta">
                  <span>{formatSize(item.file_size)}</span>
                  {item.version && <Tag bordered={false}>{item.version}</Tag>}
                </div>
                {item.category && (
                  <Tag className="software-item-tag" bordered={false}>
                    {item.category}
                  </Tag>
                )}
                {item.description && (
                  <p className="software-item-desc">{item.description}</p>
                )}
                <div className="software-item-original" title={item.original_name}>
                  {item.original_name}
                </div>
                <Space className="software-item-actions" wrap>
                  <Button
                    type="primary"
                    size="small"
                    icon={<CloudDownloadOutlined />}
                    href={assetUrl(item.file_url)}
                    target="_blank"
                    download={item.original_name}
                  >
                    下载
                  </Button>
                  <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(item)}>
                    编辑
                  </Button>
                  <Popconfirm title="确定删除该软件？" onConfirm={() => handleDelete(item.id)}>
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title="编辑软件信息"
        open={editOpen}
        onOk={handleEditSave}
        onCancel={() => setEditOpen(false)}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="显示名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="version" label="版本">
            <Input placeholder="如 1.0.0（可选）" />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Input placeholder="如 开发工具、系统工具（可选）" />
          </Form.Item>
          <Form.Item name="description" label="说明">
            <Input.TextArea rows={3} placeholder="用途说明（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SoftwarePage;
