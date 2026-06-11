import { useCallback, useEffect, useMemo, useRef, useState, type ClipboardEventHandler, type MouseEvent } from 'react';
import {
  Button,
  Empty,
  Form,
  Image,
  Input,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Spin,
  Tag,
  Upload,
  message,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PictureOutlined,
  PlusOutlined,
  ReloadOutlined,
  SendOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import {
  CATEGORY_PALETTE,
  createImageCategory,
  deleteImageCategory,
  deleteStoredImage,
  getImageCategoryLabels,
  getImageStorageDays,
  getStoredImages,
  sendStoredImage,
  updateImageCategory,
  updateStoredImage,
  type ImageCategory,
  type ImageDayStat,
  type StoredImage,
} from '../../api/imageStorage';
import { assetUrl } from '../../utils/assetUrl';
import './index.css';

type PendingImage = {
  key: string;
  file: File;
  preview: string;
};

const formatDayLabel = (day: string) => {
  const d = new Date(`${day}T12:00:00`);
  if (Number.isNaN(d.getTime())) return day;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((today.getTime() - target.getTime()) / 86400000);
  if (diff === 0) return '今天';
  if (diff === 1) return '昨天';
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  if (diff < 7) return weekdays[d.getDay()];
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const categoryColor = (index: number) => CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];

const groupByDay = (items: StoredImage[]) => {
  const sorted = [...items].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const groups: { day: string; items: StoredImage[] }[] = [];
  sorted.forEach((item) => {
    const day = item.storage_day;
    const last = groups[groups.length - 1];
    if (last?.day === day) last.items.push(item);
    else groups.push({ day, items: [item] });
  });
  return groups;
};

const ImageStorage = () => {
  const [list, setList] = useState<StoredImage[]>([]);
  const [days, setDays] = useState<ImageDayStat[]>([]);
  const [categories, setCategories] = useState<ImageCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sendCategory, setSendCategory] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const [caption, setCaption] = useState('');
  const [pending, setPending] = useState<PendingImage[]>([]);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ImageCategory | null>(null);
  const [categoryForm] = Form.useForm<{ name: string }>();

  const feedRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const loadData = useCallback(
    async (day?: string | null, category?: string | null, kw?: string) => {
      setLoading(true);
      try {
        const [listRes, daysRes, catRes] = await Promise.all([
          getStoredImages({
            day: day || undefined,
            category: category || undefined,
            keyword: kw || undefined,
            pageSize: 500,
          }),
          getImageStorageDays(category || undefined),
          getImageCategoryLabels(),
        ]);
        if (listRes.data.code === 200) setList(listRes.data.data?.list ?? []);
        if (daysRes.data.code === 200) setDays(daysRes.data.data ?? []);
        if (catRes.data.code === 200) {
          const cats = catRes.data.data ?? [];
          setCategories(cats);
          setSendCategory((prev) => {
            if (prev && cats.some((c) => c.name === prev)) return prev;
            return cats[0]?.name ?? '';
          });
        }
      } catch {
        message.error('加载失败');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData(activeDay, activeCategory, keyword);
  }, [activeDay, activeCategory, keyword, loadData]);

  useEffect(() => {
    if (activeCategory && !categories.some((c) => c.name === activeCategory)) {
      setActiveCategory(null);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [list.length, pending.length]);

  useEffect(
    () => () => {
      pending.forEach((p) => URL.revokeObjectURL(p.preview));
    },
    [pending]
  );

  const groups = useMemo(() => groupByDay(list), [list]);
  const totalCount = categories.reduce((n, c) => n + c.count, 0);
  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.name, label: c.name })),
    [categories]
  );

  const openAddCategory = () => {
    setEditingCategory(null);
    categoryForm.setFieldsValue({ name: '' });
    setCategoryModalOpen(true);
  };

  const openEditCategory = (cat: ImageCategory, e: MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(cat);
    categoryForm.setFieldsValue({ name: cat.name });
    setCategoryModalOpen(true);
  };

  const submitCategoryForm = async () => {
    const { name } = await categoryForm.validateFields();
    setSavingCategory(true);
    try {
      if (editingCategory) {
        const res = await updateImageCategory(editingCategory.id, name.trim());
        if (res.data.code === 200) {
          message.success('分类已更新');
          if (activeCategory === editingCategory.name) setActiveCategory(name.trim());
          if (sendCategory === editingCategory.name) setSendCategory(name.trim());
        }
      } else {
        const res = await createImageCategory(name.trim());
        if (res.data.code === 200 || res.data.code === 201) {
          message.success('分类已添加');
          setSendCategory(name.trim());
        }
      }
      setCategoryModalOpen(false);
      await loadData(activeDay, activeCategory, keyword);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '保存失败');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (cat: ImageCategory, e?: MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await deleteImageCategory(cat.id);
      if (res.data.code === 200) {
        message.success('分类已删除');
        if (activeCategory === cat.name) setActiveCategory(null);
        await loadData(activeDay, activeCategory === cat.name ? null : activeCategory, keyword);
      }
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { message?: string } } };
      message.error(e2.response?.data?.message || '删除失败');
    }
  };

  const addPendingFiles = (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (!images.length) {
      message.warning('请选择图片');
      return;
    }
    setPending((prev) => [
      ...prev,
      ...images.map((file) => ({
        key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
  };

  const removePending = (key: string) => {
    setPending((prev) => {
      const item = prev.find((p) => p.key === key);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((p) => p.key !== key);
    });
  };

  const handlePaste: ClipboardEventHandler = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length) {
      e.preventDefault();
      addPendingFiles(files);
    }
  };

  const uploadProps: UploadProps = {
    showUploadList: false,
    accept: 'image/*',
    multiple: true,
    beforeUpload: (file) => {
      addPendingFiles([file]);
      return false;
    },
  };

  const handleSend = async () => {
    if (!pending.length || !sendCategory) return;
    setSending(true);
    const text = caption.trim();
    try {
      for (const item of pending) {
        const res = await sendStoredImage(item.file, {
          caption: text || undefined,
          category: sendCategory,
        });
        if (res.data.code !== 201 && res.data.code !== 200) {
          throw new Error(res.data.message || '发送失败');
        }
      }
      pending.forEach((p) => URL.revokeObjectURL(p.preview));
      setPending([]);
      setCaption('');
      message.success('已保存');
      await loadData(activeDay, activeCategory, keyword);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      message.error(err.response?.data?.message || err.message || '发送失败');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await deleteStoredImage(id);
      if (res.data.code === 200) {
        message.success('已删除');
        await loadData(activeDay, activeCategory, keyword);
      }
    } catch {
      message.error('删除失败');
    }
  };

  const handleImageCategoryChange = async (id: number, category: string) => {
    try {
      const res = await updateStoredImage(id, { category });
      if (res.data.code === 200) {
        await loadData(activeDay, activeCategory, keyword);
      }
    } catch {
      message.error('更新分类失败');
    }
  };

  return (
    <div className="image-storage-page">
      <div className="image-storage-header">
        <div className="image-storage-header-main">
          <PictureOutlined className="image-storage-header-icon" />
          <h2 className="image-storage-title">图片存储</h2>
        </div>
        <Space wrap>
          <Input.Search placeholder="搜索备注" allowClear style={{ width: 160 }} onSearch={setKeyword} />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => loadData(activeDay, activeCategory, keyword)}
            loading={loading}
          />
        </Space>
      </div>

      <div className="image-storage-body">
        <aside className="image-storage-sidebar">
          <div className="image-storage-sidebar-section image-storage-sidebar-section--head">
            <span>分类</span>
            <Button type="text" size="small" icon={<PlusOutlined />} onClick={openAddCategory} />
          </div>
          <button
            type="button"
            className={`image-storage-sidebar-row${
              activeCategory == null ? ' image-storage-sidebar-row--active' : ''
            }`}
            onClick={() => setActiveCategory(null)}
          >
            <span className="image-storage-sidebar-name">全部</span>
            <span className="image-storage-sidebar-count">
              <Tag>{totalCount}</Tag>
            </span>
            <span className="image-storage-sidebar-actions" />
          </button>
          {categories.map((cat, index) => (
            <div
              key={cat.id}
              className={`image-storage-sidebar-row image-storage-cat-row${
                activeCategory === cat.name ? ' image-storage-sidebar-row--active' : ''
              }`}
            >
              <button
                type="button"
                className="image-storage-sidebar-name"
                onClick={() => setActiveCategory(cat.name)}
              >
                {cat.name}
              </button>
              <span className="image-storage-sidebar-count">
                <Tag color={categoryColor(index)}>{cat.count}</Tag>
              </span>
              <Space size={0} className="image-storage-sidebar-actions">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={(e) => openEditCategory(cat, e)}
                />
                <Popconfirm
                  title={cat.count > 0 ? `该分类下有 ${cat.count} 张图片，无法删除` : '删除该分类？'}
                  okButtonProps={{ disabled: cat.count > 0 }}
                  onConfirm={() => handleDeleteCategory(cat)}
                >
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    disabled={categories.length <= 1}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              </Space>
            </div>
          ))}

          <div className="image-storage-sidebar-section">日期</div>
          <button
            type="button"
            className={`image-storage-sidebar-row image-storage-sidebar-row--date${
              activeDay == null ? ' image-storage-sidebar-row--active' : ''
            }`}
            onClick={() => setActiveDay(null)}
          >
            <span className="image-storage-sidebar-name">全部</span>
            <span className="image-storage-sidebar-count" />
            <span className="image-storage-sidebar-actions" />
          </button>
          {days.map((d) => (
            <button
              key={d.day}
              type="button"
              className={`image-storage-sidebar-row image-storage-sidebar-row--date${
                activeDay === d.day ? ' image-storage-sidebar-row--active' : ''
              }`}
              onClick={() => setActiveDay(d.day)}
            >
              <span className="image-storage-sidebar-name">{formatDayLabel(d.day)}</span>
              <span className="image-storage-sidebar-count">
                <Tag>{d.count}</Tag>
              </span>
              <span className="image-storage-sidebar-actions" />
            </button>
          ))}
        </aside>

        <section className="image-storage-chat">
          <div ref={feedRef} className="image-storage-feed">
            {loading && !list.length ? (
              <div className="image-storage-feed-loading">
                <Spin />
              </div>
            ) : !groups.length ? (
              <Empty className="image-storage-feed-empty" description="暂无图片" />
            ) : (
              groups.map((group) => (
                <div key={group.day} className="image-storage-day-group">
                  <div className="image-storage-day-divider">
                    <span>{formatDayLabel(group.day)}</span>
                  </div>
                  {group.items.map((item) => (
                    <div key={item.id} className="image-storage-msg">
                      <div className="image-storage-msg-bubble">
                        <div className="image-storage-msg-head">
                          <Select
                            size="small"
                            variant="borderless"
                            value={item.category}
                            options={categoryOptions}
                            onChange={(v) => handleImageCategoryChange(item.id, v)}
                            className="image-storage-msg-category"
                          />
                        </div>
                        {item.caption && (
                          <div className="image-storage-msg-caption">{item.caption}</div>
                        )}
                        <img
                          className="image-storage-msg-img"
                          src={assetUrl(item.file_url)}
                          alt=""
                          onClick={() => setPreviewSrc(assetUrl(item.file_url))}
                        />
                        <div className="image-storage-msg-meta">
                          <span>{formatTime(item.created_at)}</span>
                          <Popconfirm title="删除？" onConfirm={() => handleDelete(item.id)}>
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              className="image-storage-msg-delete"
                            />
                          </Popconfirm>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          <div className="image-storage-composer">
            {pending.length > 0 && (
              <div className="image-storage-pending">
                {pending.map((item) => (
                  <div key={item.key} className="image-storage-pending-item">
                    <img src={item.preview} alt="" />
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      className="image-storage-pending-remove"
                      onClick={() => removePending(item.key)}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="image-storage-composer-top">
              {categories.length > 0 ? (
                <Segmented
                  size="small"
                  value={sendCategory}
                  onChange={(v) => setSendCategory(String(v))}
                  options={categories.map((c) => ({ value: c.name, label: c.name }))}
                />
              ) : (
                <Button type="link" size="small" icon={<PlusOutlined />} onClick={openAddCategory}>
                  添加分类
                </Button>
              )}
              <Upload {...uploadProps}>
                <Button type="text" icon={<UploadOutlined />} />
              </Upload>
            </div>
            <Input.TextArea
              ref={composerRef}
              className="image-storage-composer-input"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onPaste={handlePaste}
              placeholder="备注（可选）"
              autoSize={{ minRows: 5, maxRows: 10 }}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="image-storage-composer-actions">
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={sending}
                disabled={!pending.length || !sendCategory}
                onClick={handleSend}
              >
                发送
              </Button>
            </div>
          </div>
        </section>
      </div>

      <Modal
        title={editingCategory ? '修改分类' : '新增分类'}
        open={categoryModalOpen}
        onOk={submitCategoryForm}
        onCancel={() => setCategoryModalOpen(false)}
        confirmLoading={savingCategory}
        destroyOnHidden
        width={400}
      >
        <Form form={categoryForm} layout="vertical" requiredMark>
          <Form.Item
            name="name"
            label="分类名称"
            rules={[
              { required: true, message: '请输入名称' },
              { max: 50, message: '最多 50 字' },
            ]}
          >
            <Input placeholder="如：临时、长期" maxLength={50} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={Boolean(previewSrc)}
        footer={null}
        onCancel={() => setPreviewSrc(null)}
        width="auto"
        centered
        destroyOnHidden
        className="image-storage-preview-modal"
      >
        {previewSrc && (
          <Image src={previewSrc} alt="" style={{ maxHeight: '80vh', maxWidth: '90vw' }} preview={false} />
        )}
      </Modal>
    </div>
  );
};

export default ImageStorage;
