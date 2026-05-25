import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Drawer,
  Empty,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Switch,
  Tag,
  message,
} from 'antd';
import {
  DeleteOutlined,
  PlusOutlined,
  PushpinFilled,
  PushpinOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import './index.css';
import FormRemark from '../../components/FormRemark';
import {
  createNote,
  deleteNote,
  getNoteCategories,
  getNoteList,
  updateNote,
  type ImportantNote,
} from '../../api/note';

const COLOR_PRESETS = ['#4f46e5', '#722ed1', '#1890ff', '#52c41a', '#faad14', '#eb2f96', '#13c2c2'];

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

const NotePage = () => {
  const [list, setList] = useState<ImportantNote[]>([]);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [keyword, setKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

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

  const openCreate = () => {
    setEditingId(null);
    form.setFieldsValue({
      title: '',
      summary: '',
      content: '',
      category: activeCategory || '',
      color: '#4f46e5',
      is_pinned: false,
    });
    setDrawerOpen(true);
  };

  const openEdit = (note: ImportantNote) => {
    setEditingId(note.id);
    form.setFieldsValue({
      title: note.title,
      summary: note.summary ?? '',
      content: note.content ?? '',
      category: note.category ?? '',
      color: note.color || '#4f46e5',
      is_pinned: note.is_pinned === 1,
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const payload = {
        ...values,
        category: values.category?.trim() || null,
        is_pinned: values.is_pinned ? 1 : 0,
      };
      const res = editingId
        ? await updateNote(editingId, payload)
        : await createNote(payload);
      if (res.data.code === 200) {
        message.success(editingId ? '已保存' : '已创建');
        setDrawerOpen(false);
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
        if (editingId === id) setDrawerOpen(false);
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
              <div className="note-card-footer">
                <span>{formatTime(note.updated_at || note.created_at)}</span>
                {note.is_pinned === 1 && <span className="note-card-pin-label">置顶</span>}
              </div>
            </article>
          ))}
        </div>
      )}

      <Drawer
        title={editingId ? '编辑笔记' : '新增笔记'}
        width={720}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
        extra={
          <Space>
            {editingId && (
              <Popconfirm title="确定删除？" onConfirm={() => handleDelete(editingId)}>
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
          <Form.Item name="category" label="分类">
            <Input placeholder="如：工作、账号、代码片段（可选）" allowClear />
          </Form.Item>
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
          <Form.Item name="is_pinned" label="置顶" valuePropName="checked">
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
          <Form.Item name="summary" label="摘要">
            <Input.TextArea rows={2} placeholder="卡片上显示的简短说明（可选）" />
          </Form.Item>
          <FormRemark
            name="content"
            label="正文"
            rows={18}
            placeholder="记录重要信息、账号、命令、思路…"
          />
        </Form>
      </Drawer>
    </div>
  );
};

export default NotePage;
