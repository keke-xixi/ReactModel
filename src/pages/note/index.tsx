import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Drawer,
  Empty,
  Form,
  Input,
  Popconfirm,
  Row,
  Col,
  Select,
  Space,
  Switch,
  Tag,
  Upload,
  message,
} from 'antd';
import type { UploadFile } from 'antd/es/upload';
import {
  DeleteOutlined,
  FileOutlined,
  LinkOutlined,
  PaperClipOutlined,
  PictureOutlined,
  PlusOutlined,
  PushpinFilled,
  PushpinOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import './index.css';
import {
  createNote,
  deleteNote,
  getNoteCategories,
  getNoteList,
  updateNote,
  uploadNoteFile,
  type ImportantNote,
  type NoteAttachment,
} from '../../api/note';
import { assetUrl } from '../../utils/assetUrl';

const COLOR_PRESETS = ['#4f46e5', '#722ed1', '#1890ff', '#52c41a', '#faad14', '#eb2f96', '#13c2c2'];

type NoteFormValues = {
  title: string;
  summary: string;
  content: string;
  category: string;
  color: string;
  is_pinned: boolean;
};

const defaultForm: NoteFormValues = {
  title: '',
  summary: '',
  content: '',
  category: '',
  color: '#4f46e5',
  is_pinned: false,
};

const formatTime = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const cardPreview = (note: ImportantNote) => {
  if (note.summary?.trim()) return note.summary.trim();
  const text = note.content?.trim();
  if (!text) return '暂无内容';
  return text.length > 120 ? `${text.slice(0, 120)}…` : text;
};

const toFormValues = (note: ImportantNote | null, categoryFallback = ''): NoteFormValues => {
  if (!note) {
    return { ...defaultForm, category: categoryFallback };
  }
  return {
    title: note.title ?? '',
    summary: note.summary ?? '',
    content: note.content ?? '',
    category: note.category ?? '',
    color: note.color || '#4f46e5',
    is_pinned: note.is_pinned === 1,
  };
};

const appendMarkdown = (content: string, item: NoteAttachment) => {
  const url = assetUrl(item.url);
  const line =
    item.type === 'image'
      ? `![${item.name}](${url})`
      : `[📎 ${item.name}](${url})`;
  return content?.trim() ? `${content.trim()}\n\n${line}` : line;
};

const NotePage = () => {
  const [list, setList] = useState<ImportantNote[]>([]);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [keyword, setKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ImportantNote | null>(null);
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [form] = Form.useForm<NoteFormValues>();

  const loadData = useCallback(async (kw?: string, category?: string | null) => {
    setLoading(true);
    try {
      const [listRes, catRes] = await Promise.all([
        getNoteList({ keyword: kw || undefined, category: category || undefined }),
        getNoteCategories(),
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

  const pinnedCount = useMemo(() => list.filter((n) => n.is_pinned === 1).length, [list]);

  const imageFileList: UploadFile[] = useMemo(
    () =>
      attachments
        .filter((a) => a.type === 'image')
        .map((a, i) => ({
          uid: `${a.url}-${i}`,
          name: a.name,
          status: 'done' as const,
          url: assetUrl(a.url),
        })),
    [attachments]
  );

  const fillDrawer = (note: ImportantNote | null) => {
    form.resetFields();
    form.setFieldsValue(toFormValues(note, activeCategory || ''));
    setAttachments(note?.attachments ?? []);
  };

  const openCreate = () => {
    setEditingNote(null);
    setDrawerOpen(true);
  };

  const openEdit = (note: ImportantNote) => {
    setEditingNote(note);
    setDrawerOpen(true);
  };

  const handleDrawerAfterOpen = (open: boolean) => {
    if (open) fillDrawer(editingNote);
  };

  const handleUpload = async (file: File) => {
    const res = await uploadNoteFile(file);
    if (res.data.code !== 200) throw new Error(res.data.message || '上传失败');
    return res.data.data;
  };

  const addAttachment = (item: NoteAttachment, insertToContent = false) => {
    setAttachments((prev) => [...prev, item]);
    if (insertToContent) {
      const content = form.getFieldValue('content') as string;
      form.setFieldValue('content', appendMarkdown(content, item));
    }
  };

  const removeAttachment = (url: string) => {
    setAttachments((prev) => prev.filter((a) => a.url !== url));
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const payload = {
        ...values,
        category: values.category?.trim() || null,
        is_pinned: values.is_pinned ? 1 : 0,
        attachments,
      };
      const res = editingNote
        ? await updateNote(editingNote.id, payload)
        : await createNote(payload);
      if (res.data.code === 200) {
        message.success(editingNote ? '已保存' : '已创建');
        setDrawerOpen(false);
        setEditingNote(null);
        loadData(keyword, activeCategory);
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
      const res = await deleteNote(id);
      if (res.data.code === 200) {
        message.success('已删除');
        if (editingNote?.id === id) {
          setDrawerOpen(false);
          setEditingNote(null);
        }
        loadData(keyword, activeCategory);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '删除失败');
    }
  };

  const togglePin = async (note: ImportantNote, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateNote(note.id, { is_pinned: note.is_pinned === 1 ? 0 : 1 });
      loadData(keyword, activeCategory);
    } catch {
      message.error('操作失败');
    }
  };

  return (
    <div className="note-page">
      <div className="note-toolbar">
        <Space wrap>
          <Input.Search
            placeholder="搜索标题、内容、分类"
            allowClear
            style={{ width: 280 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={() => loadData(keyword, activeCategory)}
          />
          <Button icon={<ReloadOutlined />} loading={loading} onClick={() => loadData(keyword, activeCategory)}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增
          </Button>
        </Space>
        <span className="note-toolbar-meta">
          共 {list.length} 条{pinnedCount > 0 ? ` · ${pinnedCount} 条置顶` : ''}
        </span>
      </div>

      {categories.length > 0 && (
        <div className="note-nav">
          <button
            type="button"
            className={`note-category-tab${activeCategory === null ? ' note-category-tab--active' : ''}`}
            onClick={() => setActiveCategory(null)}
          >
            全部
          </button>
          {categories.map((item) => (
            <button
              key={item.category}
              type="button"
              className={`note-category-tab${
                activeCategory === item.category ? ' note-category-tab--active' : ''
              }`}
              onClick={() => setActiveCategory(item.category)}
            >
              {item.category}
              <span className="note-category-tab-count">{item.count}</span>
            </button>
          ))}
        </div>
      )}

      {!loading && list.length === 0 ? (
        <Empty className="note-empty" description="暂无笔记，点击「新增」开始记录">
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增笔记
          </Button>
        </Empty>
      ) : (
        <div className="note-grid">
          {list.map((note) => (
            <article
              key={note.id}
              className={`note-card${note.is_pinned === 1 ? ' note-card--pinned' : ''}`}
              style={{ borderLeftColor: note.color || '#4f46e5' }}
              onClick={() => openEdit(note)}
            >
              <div className="note-card-head">
                <div className="note-card-title">{note.title}</div>
                <Space size={4} onClick={(e) => e.stopPropagation()}>
                  <Button
                    type="text"
                    size="small"
                    icon={note.is_pinned === 1 ? <PushpinFilled /> : <PushpinOutlined />}
                    className={note.is_pinned === 1 ? 'note-pin-btn--active' : ''}
                    onClick={(e) => togglePin(note, e)}
                  />
                  <Popconfirm title="确定删除这条笔记？" onConfirm={() => handleDelete(note.id)}>
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              </div>
              {note.category && (
                <Tag className="note-card-tag" bordered={false}>
                  {note.category}
                </Tag>
              )}
              <p className="note-card-preview">{cardPreview(note)}</p>
              {(note.attachments?.length ?? 0) > 0 && (
                <div className="note-card-attachments">
                  <PaperClipOutlined />
                  <span>{note.attachments!.length} 个附件</span>
                </div>
              )}
              <div className="note-card-footer">
                <span>{formatTime(note.updated_at || note.created_at)}</span>
                {note.is_pinned === 1 && <span className="note-card-pin-label">置顶</span>}
              </div>
            </article>
          ))}
        </div>
      )}

      <Drawer
        title={editingNote ? '编辑笔记' : '新增笔记'}
        width={760}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingNote(null);
        }}
        afterOpenChange={handleDrawerAfterOpen}
        destroyOnClose
        className="note-drawer"
        extra={
          <Space>
            {editingNote && (
              <Popconfirm title="确定删除？" onConfirm={() => handleDelete(editingNote.id)}>
                <Button danger size="small">
                  删除
                </Button>
              </Popconfirm>
            )}
            <Button type="primary" onClick={handleSave} loading={saving}>
              保存
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" requiredMark className="note-drawer-form">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="简短标题，方便检索" />
          </Form.Item>

          <Form.Item
            name="content"
            label="正文"
            className="note-form-content"
            rules={[{ required: true, message: '请输入正文' }]}
          >
            <Input.TextArea
              rows={14}
              placeholder="记录重要信息、账号、命令、思路…&#10;上传图片/文件后可点击「插入正文」"
              className="note-content-textarea"
            />
          </Form.Item>

          <div className="note-attachments-block">
            <div className="note-attachments-head">
              <span className="note-attachments-title">图片与附件</span>
              <span className="note-attachments-hint">支持 jpg/png/gif、pdf/doc/xls/zip/txt 等，单文件最大 15MB</span>
            </div>

            <div className="note-attachments-uploads">
              <Upload
                listType="picture-card"
                fileList={imageFileList}
                accept="image/*"
                showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
                customRequest={async ({ file, onSuccess, onError }) => {
                  setImageUploading(true);
                  try {
                    const item = await handleUpload(file as File);
                    addAttachment(item, true);
                    onSuccess?.(item);
                    message.success('图片已上传并插入正文');
                  } catch (err) {
                    onError?.(err as Error);
                    message.error((err as Error).message || '图片上传失败');
                  } finally {
                    setImageUploading(false);
                  }
                }}
                onRemove={(file) => {
                  const match = attachments.find((a) => assetUrl(a.url) === file.url || a.name === file.name);
                  if (match) removeAttachment(match.url);
                  return true;
                }}
              >
                {imageFileList.length < 12 && (
                  <div className="note-upload-trigger">
                    <PictureOutlined />
                    <span>{imageUploading ? '上传中' : '上传图片'}</span>
                  </div>
                )}
              </Upload>

              <Upload
                showUploadList={false}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.md"
                customRequest={async ({ file, onSuccess, onError }) => {
                  setFileUploading(true);
                  try {
                    const item = await handleUpload(file as File);
                    addAttachment(item, false);
                    onSuccess?.(item);
                    message.success('文件已上传');
                  } catch (err) {
                    onError?.(err as Error);
                    message.error((err as Error).message || '文件上传失败');
                  } finally {
                    setFileUploading(false);
                  }
                }}
              >
                <Button icon={<PaperClipOutlined />} loading={fileUploading}>
                  上传文件
                </Button>
              </Upload>
            </div>

            {attachments.filter((a) => a.type === 'file').length > 0 && (
              <ul className="note-file-list">
                {attachments
                  .filter((a) => a.type === 'file')
                  .map((item) => (
                    <li key={item.url} className="note-file-item">
                      <FileOutlined />
                      <a href={assetUrl(item.url)} target="_blank" rel="noreferrer" className="note-file-name">
                        {item.name}
                      </a>
                      <Space size={4}>
                        <Button
                          type="link"
                          size="small"
                          icon={<LinkOutlined />}
                          onClick={() => {
                            const content = form.getFieldValue('content') as string;
                            form.setFieldValue('content', appendMarkdown(content, item));
                          }}
                        >
                          插入正文
                        </Button>
                        <Button type="link" size="small" danger onClick={() => removeAttachment(item.url)}>
                          移除
                        </Button>
                      </Space>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="summary" label="摘要">
                <Input.TextArea rows={2} placeholder="卡片上显示的简短说明（可选）" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="分类">
                <Input placeholder="如：工作、账号（可选）" allowClear />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="color" label="卡片颜色">
                <Select
                  options={COLOR_PRESETS.map((c) => ({
                    value: c,
                    label: (
                      <Space>
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: c,
                            display: 'inline-block',
                          }}
                        />
                        {c}
                      </Space>
                    ),
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_pinned" label="置顶" valuePropName="checked">
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>
    </div>
  );
};

export default NotePage;
