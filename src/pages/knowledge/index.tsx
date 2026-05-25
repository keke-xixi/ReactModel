import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Tag,
  Upload,
  message,
} from 'antd';
import {
  AppstoreOutlined,
  ColumnHeightOutlined,
  DeleteOutlined,
  HolderOutlined,
  LeftOutlined,
  PlusOutlined,
  ReloadOutlined,
  RightOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload';
import './index.css';
import FormRemark from '../../components/FormRemark';
import { assetUrl } from '../../utils/assetUrl';
import {
  createKnowledgeCategory,
  createKnowledgePoint,
  deleteKnowledgeCategory,
  deleteKnowledgePoint,
  getKnowledgeBoard,
  getKnowledgePoint,
  updateKnowledgeCategory,
  updateKnowledgePoint,
  uploadKnowledgeImage,
  type BoardColumn,
  type KnowledgePoint,
} from '../../api/knowledge';

const COLOR_PRESETS = ['#722ed1', '#52c41a', '#faad14', '#1890ff', '#eb2f96', '#13c2c2'];

const statusOptions = [
  { value: 1, label: '已发布' },
  { value: 0, label: '草稿' },
];

type DropTarget = { columnId: number; index: number; overCardId?: number };
type ViewMode = 'board' | 'focus';

const COLUMN_WIDTH = 272;

const swapCardsInBoard = (columns: BoardColumn[], cardIdA: number, cardIdB: number): BoardColumn[] =>
  columns.map((col) => {
    const idxA = col.points.findIndex((p) => p.id === cardIdA);
    const idxB = col.points.findIndex((p) => p.id === cardIdB);
    if (idxA === -1 || idxB === -1) return col;
    const points = [...col.points];
    [points[idxA], points[idxB]] = [points[idxB], points[idxA]];
    return { ...col, points };
  });

const reorderPointsInBoard = (
  columns: BoardColumn[],
  cardId: number,
  toColumnId: number,
  toIndex: number
): BoardColumn[] => {
  let moved: KnowledgePoint | null = null;
  const stripped = columns.map((col) => {
    const found = col.points.find((p) => p.id === cardId);
    if (!found) return col;
    moved = found;
    return { ...col, points: col.points.filter((p) => p.id !== cardId) };
  });
  if (!moved) return columns;
  return stripped.map((col) => {
    if (col.id !== toColumnId) return col;
    const points = [...col.points];
    points.splice(toIndex, 0, { ...moved!, category_id: toColumnId });
    return { ...col, points };
  });
};

const reorderColumnsInBoard = (columns: BoardColumn[], fromIndex: number, toIndex: number) => {
  const next = [...columns];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
};

const Knowledge = () => {
  const [board, setBoard] = useState<BoardColumn[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryForm] = Form.useForm();

  const [quickPointModal, setQuickPointModal] = useState(false);
  const [quickCategoryId, setQuickCategoryId] = useState<number | null>(null);
  const [quickForm] = Form.useForm();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pointForm] = Form.useForm();
  const [editingPointId, setEditingPointId] = useState<number | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [dragCardId, setDragCardId] = useState<number | null>(null);
  const [dragColumnIndex, setDragColumnIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [columnDropIndex, setColumnDropIndex] = useState<number | null>(null);
  const cardDragMovedRef = useRef(false);

  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const categoryTabsRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const loadBoard = useCallback(async (kw?: string) => {
    setLoading(true);
    try {
      const res = await getKnowledgeBoard({ keyword: kw || undefined });
      if (res.data.code === 200) {
        setBoard(res.data.data ?? []);
      } else {
        message.error(res.data.message || '加载失败');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '加载看板失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    if (!board.length) {
      setActiveCategoryId(null);
      return;
    }
    if (activeCategoryId == null || !board.some((c) => c.id === activeCategoryId)) {
      setActiveCategoryId(board[0].id);
    }
  }, [board, activeCategoryId]);

  const displayBoard = useMemo(() => {
    if (viewMode === 'board') return board;
    if (!activeCategoryId) return board.slice(0, 1);
    const col = board.find((c) => c.id === activeCategoryId);
    return col ? [col] : board.slice(0, 1);
  }, [board, viewMode, activeCategoryId]);

  const scrollToColumn = useCallback(
    (columnId: number) => {
      setActiveCategoryId(columnId);
      if (viewMode === 'focus') return;
      requestAnimationFrame(() => {
        columnRefs.current.get(columnId)?.scrollIntoView({
          behavior: 'smooth',
          inline: 'start',
          block: 'nearest',
        });
      });
    },
    [viewMode]
  );

  const scrollBoard = (direction: -1 | 1) => {
    const el = boardRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.75, COLUMN_WIDTH + 16), behavior: 'smooth' });
  };

  const scrollCategoryTabs = (direction: -1 | 1) => {
    const el = categoryTabsRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.65, 220), behavior: 'smooth' });
  };

  const persistColumnPoints = async (columnId: number, points: KnowledgePoint[]) => {
    await Promise.all(
      points.map((p, index) =>
        updateKnowledgePoint(p.id, { category_id: columnId, sort_order: index })
      )
    );
  };

  const persistColumnOrder = async (columns: BoardColumn[]) => {
    await Promise.all(
      columns.map((col, index) => updateKnowledgeCategory(col.id, { sort_order: index }))
    );
  };

  const handleSearch = () => loadBoard(keyword);

  const openQuickAdd = (categoryId: number) => {
    setQuickCategoryId(categoryId);
    quickForm.setFieldsValue({ title: '' });
    setQuickPointModal(true);
  };

  const submitQuickPoint = async () => {
    const { title } = await quickForm.validateFields();
    if (!quickCategoryId) return;
    try {
      const res = await createKnowledgePoint({
        category_id: quickCategoryId,
        title,
        status: 0,
      });
      if (res.data.code === 200) {
        message.success('已创建，可点击卡片补充详情');
        setQuickPointModal(false);
        loadBoard(keyword);
        openPointDrawer(res.data.data.id);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '创建失败');
    }
  };

  const openPointDrawer = async (id: number) => {
    try {
      const res = await getKnowledgePoint(id);
      if (res.data.code !== 200) return;
      const p = res.data.data;
      setEditingPointId(p.id);
      setCoverUrl(p.cover_image);
      setImageUrls(p.images || []);
      pointForm.setFieldsValue({
        title: p.title,
        content: p.content ?? '',
        summary: p.summary ?? '',
        tags: p.tags ?? '',
        status: p.status,
      });
      setDrawerOpen(true);
    } catch {
      message.error('加载详情失败');
    }
  };

  const handleUpload = async (file: File) => {
    const res = await uploadKnowledgeImage(file);
    if (res.data.code === 200) return res.data.data.url;
    throw new Error(res.data.message || '上传失败');
  };

  const submitPoint = async () => {
    const values = await pointForm.validateFields();
    setSaving(true);
    try {
      const payload = {
        ...values,
        cover_image: coverUrl,
        images: imageUrls,
      };
      const res = editingPointId
        ? await updateKnowledgePoint(editingPointId, payload)
        : await createKnowledgePoint(payload);
      if (res.data.code === 200) {
        message.success('保存成功');
        setDrawerOpen(false);
        loadBoard(keyword);
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

  const handleDeletePoint = async (id?: number) => {
    const pointId = id ?? editingPointId;
    if (!pointId) return;
    try {
      const res = await deleteKnowledgePoint(pointId);
      if (res.data.code === 200) {
        message.success('已删除');
        if (pointId === editingPointId) {
          setDrawerOpen(false);
          setEditingPointId(null);
        }
        loadBoard(keyword);
      } else {
        message.error(res.data.message || '删除失败');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '删除失败');
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      const res = await deleteKnowledgeCategory(categoryId);
      if (res.data.code === 200) {
        message.success('分类已删除');
        loadBoard(keyword);
      } else {
        message.error(res.data.message || '删除失败');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '删除失败');
    }
  };

  const submitCategory = async () => {
    const values = await categoryForm.validateFields();
    setSaving(true);
    try {
      const res = await createKnowledgeCategory(values);
      if (res.data.code === 200) {
        message.success('分类已创建');
        setCategoryModalOpen(false);
        loadBoard(keyword);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '创建失败');
    } finally {
      setSaving(false);
    }
  };

  const saveBoardOrder = async (prevBoard: BoardColumn[], nextBoard: BoardColumn[], dragId: number) => {
    const sourceCol = prevBoard.find((c) => c.points.some((p) => p.id === dragId));
    const tasks: Promise<unknown>[] = [];
    const touchedColIds = new Set<number>();
    if (sourceCol) touchedColIds.add(sourceCol.id);
    nextBoard.forEach((c) => {
      if (c.points.some((p) => p.id === dragId)) touchedColIds.add(c.id);
    });
    touchedColIds.forEach((colId) => {
      const col = nextBoard.find((c) => c.id === colId);
      if (col) tasks.push(persistColumnPoints(col.id, col.points));
    });
    await Promise.all(tasks);
  };

  const finishCardDrag = async (prevBoard: BoardColumn[], nextBoard: BoardColumn[]) => {
    if (dragCardId == null) return;
    const dragId = dragCardId;
    setBoard(nextBoard);
    setDragCardId(null);
    setDropTarget(null);
    try {
      await saveBoardOrder(prevBoard, nextBoard, dragId);
      message.success('排序已保存');
    } catch {
      message.error('保存排序失败');
      loadBoard(keyword);
    }
  };

  /** 拖到列顶：排到第一位 */
  const handleCardDropAtIndex = (columnId: number, index: number) => {
    if (dragCardId == null) return;
    const prevBoard = board;
    const nextBoard = reorderPointsInBoard(board, dragCardId, columnId, index);
    finishCardDrag(prevBoard, nextBoard);
  };

  /** 拖到某张卡片上：同列交换位置，跨列插入到该卡片位置 */
  const handleCardDropOnCard = (columnId: number, targetPointId: number) => {
    if (dragCardId == null || dragCardId === targetPointId) return;
    const prevBoard = board;
    const sourceCol = board.find((c) => c.points.some((p) => p.id === dragCardId));
    const targetCol = board.find((c) => c.id === columnId);
    if (!sourceCol || !targetCol) return;

    const targetIdx = targetCol.points.findIndex((p) => p.id === targetPointId);
    if (targetIdx === -1) return;

    let nextBoard: BoardColumn[];
    if (sourceCol.id === columnId) {
      nextBoard = swapCardsInBoard(board, dragCardId, targetPointId);
    } else {
      nextBoard = reorderPointsInBoard(board, dragCardId, columnId, targetIdx);
    }
    finishCardDrag(prevBoard, nextBoard);
  };

  const handleColumnDrop = async (toIndex: number) => {
    if (dragColumnIndex == null || dragColumnIndex === toIndex) {
      setDragColumnIndex(null);
      setColumnDropIndex(null);
      return;
    }
    const nextBoard = reorderColumnsInBoard(board, dragColumnIndex, toIndex);
    setBoard(nextBoard);
    setDragColumnIndex(null);
    setColumnDropIndex(null);
    try {
      await persistColumnOrder(nextBoard);
      message.success('分类顺序已保存');
    } catch {
      message.error('保存分类顺序失败');
      loadBoard(keyword);
    }
  };

  const coverUploadList: UploadFile[] = coverUrl
    ? [{ uid: '-1', name: 'cover', status: 'done', url: assetUrl(coverUrl) }]
    : [];

  const imagesUploadList: UploadFile[] = imageUrls.map((url, i) => ({
    uid: String(i),
    name: `img-${i}`,
    status: 'done' as const,
    url: assetUrl(url),
  }));

  return (
    <div className="knowledge-page">
      <div className="knowledge-toolbar">
        <Space wrap>
          <Input.Search
            placeholder="按标题、摘要、内容、标签筛选"
            allowClear
            style={{ width: 280 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={handleSearch}
          />
          <Button icon={<ReloadOutlined />} onClick={() => loadBoard(keyword)} loading={loading}>
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              categoryForm.setFieldsValue({ name: '', description: '', color: '#722ed1', sort_order: 0 });
              setCategoryModalOpen(true);
            }}
          >
            新增
          </Button>
        </Space>
        <Segmented<ViewMode>
          value={viewMode}
          onChange={(v) => setViewMode(v)}
          options={[
            { value: 'focus', label: '单列', icon: <ColumnHeightOutlined /> },
            { value: 'board', label: '看板', icon: <AppstoreOutlined /> },
          ]}
        />
      </div>

      {board.length > 0 && (
        <div className="knowledge-nav">
          <div className="knowledge-category-tabs-wrap">
            <Button
              type="default"
              shape="circle"
              size="small"
              className="knowledge-nav-scroll-btn"
              icon={<LeftOutlined />}
              aria-label="分类向左"
              onClick={() => scrollCategoryTabs(-1)}
            />
            <div ref={categoryTabsRef} className="knowledge-category-tabs">
              {board.map((column) => (
                <button
                  key={column.id}
                  type="button"
                  className={`knowledge-category-tab${
                    activeCategoryId === column.id ? ' knowledge-category-tab--active' : ''
                  }`}
                  onClick={() => scrollToColumn(column.id)}
                >
                  <span
                    className="knowledge-category-tab-dot"
                    style={{ background: column.color || '#722ed1' }}
                  />
                  <span className="knowledge-category-tab-name">{column.name}</span>
                  <span className="knowledge-category-tab-count">{column.points.length}</span>
                </button>
              ))}
            </div>
            <Button
              type="default"
              shape="circle"
              size="small"
              className="knowledge-nav-scroll-btn"
              icon={<RightOutlined />}
              aria-label="分类向右"
              onClick={() => scrollCategoryTabs(1)}
            />
          </div>
        </div>
      )}

      <div className={`knowledge-board-wrap${viewMode === 'focus' ? ' knowledge-board-wrap--focus' : ''}`}>
        {viewMode === 'board' && board.length > 1 && (
          <>
            <Button
              type="default"
              shape="circle"
              className="knowledge-scroll-btn knowledge-scroll-btn--left"
              icon={<LeftOutlined />}
              aria-label="向左滚动"
              onClick={() => scrollBoard(-1)}
            />
            <Button
              type="default"
              shape="circle"
              className="knowledge-scroll-btn knowledge-scroll-btn--right"
              icon={<RightOutlined />}
              aria-label="向右滚动"
              onClick={() => scrollBoard(1)}
            />
          </>
        )}
        <div
          ref={boardRef}
          className={`knowledge-board${viewMode === 'focus' ? ' knowledge-board--focus' : ''}`}
        >
        {displayBoard.map((column) => {
          const colIndex = board.findIndex((c) => c.id === column.id);
          return (
          <div
            key={column.id}
            ref={(el) => {
              if (el) columnRefs.current.set(column.id, el);
              else columnRefs.current.delete(column.id);
            }}
            className="knowledge-column-wrap"
          >
            <div
              className={`knowledge-drop-slot${
                columnDropIndex === colIndex && dragColumnIndex != null
                  ? ' knowledge-drop-slot--active'
                  : ''
              }`}
              onDragOver={(e) => {
                if (dragColumnIndex == null) return;
                e.preventDefault();
                setColumnDropIndex(colIndex);
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleColumnDrop(colIndex);
              }}
            />
            <div
              className={`knowledge-column${
                dragColumnIndex === colIndex ? ' knowledge-column--dragging' : ''
              }${
                columnDropIndex === colIndex && dragColumnIndex != null
                  ? ' knowledge-column--drop-target'
                  : ''
              }${
                activeCategoryId === column.id ? ' knowledge-column--highlight' : ''
              }`}
            >
              <div
                className="knowledge-column-header"
                draggable
                onDragStart={(e) => {
                  setDragColumnIndex(colIndex);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragEnd={() => {
                  setDragColumnIndex(null);
                  setColumnDropIndex(null);
                }}
              >
                <div className="knowledge-column-title-row">
                  <HolderOutlined className="knowledge-column-drag-hint" />
                  <span
                    className="knowledge-column-dot"
                    style={{ background: column.color || '#722ed1' }}
                  />
                  <span className="knowledge-column-name">{column.name}</span>
                  <span className="knowledge-column-count">{column.points.length}</span>
                </div>
                {column.description && (
                  <div className="knowledge-column-desc">{column.description}</div>
                )}
                <div
                  className="knowledge-column-actions"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => openQuickAdd(column.id)}
                  />
                  <Popconfirm
                    title={
                      column.points.length > 0
                        ? `该分类下有 ${column.points.length} 个知识点，确定删除整个分类？`
                        : '确定删除该分类？'
                    }
                    onConfirm={() => handleDeleteCategory(column.id)}
                  >
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </div>
              </div>
              <div className="knowledge-column-body">
                {dragCardId != null && (
                  <div
                    className={`knowledge-column-top-zone${
                      dropTarget?.columnId === column.id &&
                      dropTarget.index === 0 &&
                      !dropTarget.overCardId
                        ? ' knowledge-column-top-zone--active'
                        : ''
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDropTarget({ columnId: column.id, index: 0 });
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCardDropAtIndex(column.id, 0);
                    }}
                  >
                    拖到此处排到最前
                  </div>
                )}
                {column.points.length === 0 ? (
                  <div
                    className="knowledge-empty-column"
                    onDragOver={(e) => {
                      if (dragCardId == null) return;
                      e.preventDefault();
                      setDropTarget({ columnId: column.id, index: 0 });
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleCardDropAtIndex(column.id, 0);
                    }}
                  >
                    拖拽到此处，或点击 + 添加
                  </div>
                ) : (
                  column.points.map((point) => (
                    <div
                      key={point.id}
                      draggable
                      className={`knowledge-card${
                        dragCardId === point.id ? ' knowledge-card--dragging' : ''
                      }${
                        dropTarget?.overCardId === point.id ? ' knowledge-card--drop-over' : ''
                      }`}
                      onDragStart={(e) => {
                        cardDragMovedRef.current = false;
                        setDragCardId(point.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDrag={(e) => {
                        if (e.clientX !== 0 || e.clientY !== 0) {
                          cardDragMovedRef.current = true;
                        }
                      }}
                      onDragOver={(e) => {
                        if (dragCardId == null || dragCardId === point.id) return;
                        e.preventDefault();
                        e.stopPropagation();
                        const idx = column.points.findIndex((p) => p.id === point.id);
                        setDropTarget({
                          columnId: column.id,
                          index: idx,
                          overCardId: point.id,
                        });
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCardDropOnCard(column.id, point.id);
                      }}
                      onDragEnd={() => {
                        setDragCardId(null);
                        setDropTarget(null);
                      }}
                      onClick={() => {
                        if (cardDragMovedRef.current) {
                          cardDragMovedRef.current = false;
                          return;
                        }
                        openPointDrawer(point.id);
                      }}
                    >
                        {point.cover_image && (
                          <img
                            className="knowledge-card-cover"
                            src={assetUrl(point.cover_image)}
                            alt=""
                            draggable={false}
                          />
                        )}
                        <div className="knowledge-card-meta">
                          <HolderOutlined style={{ color: '#ccc', fontSize: 12 }} />
                          <Tag color={point.status === 1 ? 'blue' : 'default'}>
                            {point.status === 1 ? '已发布' : '草稿'}
                          </Tag>
                          <Popconfirm
                            title="确定删除该知识点？"
                            onConfirm={() => handleDeletePoint(point.id)}
                          >
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              className="knowledge-card-delete"
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                            />
                          </Popconfirm>
                        </div>
                        <div className="knowledge-card-title">{point.title}</div>
                        {point.summary && (
                          <div className="knowledge-card-summary">{point.summary}</div>
                        )}
                    </div>
                  ))
                )}
                {dragCardId != null && column.points.length > 0 && (
                  <div
                    className={`knowledge-column-bottom-zone${
                      dropTarget?.columnId === column.id &&
                      dropTarget.index === column.points.length &&
                      !dropTarget.overCardId
                        ? ' knowledge-column-top-zone--active'
                        : ''
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDropTarget({
                        columnId: column.id,
                        index: column.points.length,
                      });
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleCardDropAtIndex(column.id, column.points.length);
                    }}
                  >
                    拖到底部排到最后
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        })}
        {viewMode === 'board' && dragColumnIndex != null && (
          <div
            className={`knowledge-drop-slot${
              columnDropIndex === board.length ? ' knowledge-drop-slot--active' : ''
            }`}
            style={{ alignSelf: 'stretch', minHeight: 80 }}
            onDragOver={(e) => {
              e.preventDefault();
              setColumnDropIndex(board.length);
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleColumnDrop(board.length);
            }}
          />
        )}
        {!loading && board.length === 0 && (
          <div style={{ padding: 40, color: '#999' }}>
            暂无分类，请先「新建分类列」
          </div>
        )}
        </div>
      </div>

      <Modal
        title="新建分类列"
        open={categoryModalOpen}
        onOk={submitCategory}
        onCancel={() => setCategoryModalOpen(false)}
        confirmLoading={saving}
        destroyOnClose
        width={480}
      >
        <Form form={categoryForm} layout="vertical" requiredMark>
          <Form.Item name="name" label="分类名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：前端开发" />
          </Form.Item>
          <Form.Item name="color" label="列颜色" rules={[{ required: true }]}>
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
          <FormRemark name="description" label="说明" placeholder="可选，显示在列标题下方" />
          <Form.Item name="sort_order" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="快速添加知识点"
        open={quickPointModal}
        onOk={submitQuickPoint}
        onCancel={() => setQuickPointModal(false)}
        destroyOnClose
        width={480}
      >
        <Form form={quickForm} layout="vertical" requiredMark>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="输入标题后可在详情中补充图片与内容" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="知识点详情"
        width={880}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ body: { paddingTop: 16 } }}
        extra={
          <Space>
            <Popconfirm title="确定删除该知识点？" onConfirm={() => handleDeletePoint()}>
              <Button danger size="small">
                删除
              </Button>
            </Popconfirm>
            <Button type="primary" onClick={submitPoint} loading={saving}>
              保存
            </Button>
          </Space>
        }
      >
        <Form form={pointForm} layout="vertical" requiredMark className="knowledge-drawer-content-main">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select options={statusOptions} style={{ width: 160 }} />
          </Form.Item>
          <FormRemark
            name="content"
            label="详细内容"
            rows={16}
            placeholder="主要记录区：知识点说明、代码片段、步骤笔记…"
          />
          <Form.Item name="summary" label="摘要">
            <Input.TextArea rows={2} placeholder="卡片上显示的简短说明（可选）" />
          </Form.Item>
          <Form.Item label="封面图">
            <Upload
              listType="picture-card"
              fileList={coverUploadList}
              maxCount={1}
              customRequest={async ({ file, onSuccess, onError }) => {
                try {
                  const url = await handleUpload(file as File);
                  setCoverUrl(url);
                  onSuccess?.(url);
                } catch (err) {
                  onError?.(err as Error);
                  message.error('封面上传失败');
                }
              }}
              onRemove={() => {
                setCoverUrl(null);
                return true;
              }}
            >
              {coverUploadList.length === 0 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>上传封面</div>
                </div>
              )}
            </Upload>
          </Form.Item>
          <Form.Item label="附图（可多张）">
            <Upload
              listType="picture-card"
              fileList={imagesUploadList}
              customRequest={async ({ file, onSuccess, onError }) => {
                try {
                  const url = await handleUpload(file as File);
                  setImageUrls((prev) => [...prev, url]);
                  onSuccess?.(url);
                } catch (err) {
                  onError?.(err as Error);
                  message.error('图片上传失败');
                }
              }}
              onRemove={(file) => {
                const idx = imagesUploadList.findIndex((f) => f.uid === file.uid);
                if (idx >= 0) setImageUrls((prev) => prev.filter((_, i) => i !== idx));
                return true;
              }}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上传</div>
              </div>
            </Upload>
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Input placeholder="逗号分隔，如 React,Hooks" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default Knowledge;
