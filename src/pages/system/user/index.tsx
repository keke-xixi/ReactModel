import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Descriptions,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tree,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';
import { getMenuList, type MenuRecord } from '../../../api/menu';
import {
  clearUserData,
  createUser,
  deleteUser,
  getUser,
  getUserDataStats,
  getUserList,
  transferUserData,
  updateUser,
  type SysUser,
  type UserDataStats,
  type UserFormValues,
} from '../../../api/user';
import useAuthStore from '../../../store/authStore';
import './index.css';

const statusOptions = [
  { value: 1, label: '正常' },
  { value: 0, label: '停用' },
];

const defaultForm: UserFormValues = {
  username: '',
  password: '',
  nickname: '',
  status: 1,
  is_admin: 0,
  menu_ids: [],
};

const STAT_LABELS: { key: keyof UserDataStats; label: string }[] = [
  { key: 'knowledge_category', label: '知识分类' },
  { key: 'knowledge_point', label: '知识点' },
  { key: 'important_note', label: '重要笔记' },
  { key: 'software', label: '软件库' },
  { key: 'report', label: '报表' },
];

const buildMenuTreeData = (list: MenuRecord[], parentId = 0): DataNode[] =>
  list
    .filter((item) => item.parent_id === parentId && item.type !== 3)
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
    .map((item) => {
      const children = buildMenuTreeData(list, item.id);
      return {
        key: item.id,
        title: `${item.label} (${item.menu_key})`,
        children: children.length ? children : undefined,
      };
    });

const SystemUsers = () => {
  const currentUser = useAuthStore((s) => s.user);
  const [form] = Form.useForm<UserFormValues>();
  const [list, setList] = useState<SysUser[]>([]);
  const [menuList, setMenuList] = useState<MenuRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<SysUser | null>(null);
  const [checkedMenuIds, setCheckedMenuIds] = useState<number[]>([]);

  const [dataModalOpen, setDataModalOpen] = useState(false);
  const [dataUser, setDataUser] = useState<SysUser | null>(null);
  const [dataStats, setDataStats] = useState<UserDataStats | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataActionLoading, setDataActionLoading] = useState(false);

  const [transferOpen, setTransferOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState<SysUser | null>(null);
  const [transferToId, setTransferToId] = useState<number | null>(null);

  const menuTree = useMemo(() => buildMenuTreeData(menuList), [menuList]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUserList();
      if (res.data.code === 200) setList(res.data.data ?? []);
      else message.error(res.data.message || '加载失败');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '加载用户失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMenus = useCallback(async () => {
    try {
      const res = await getMenuList();
      if (res.data.code === 200) setMenuList(res.data.data ?? []);
    } catch {
      message.error('加载菜单列表失败');
    }
  }, []);

  const loadUserStats = async (user: SysUser) => {
    setDataLoading(true);
    try {
      const res = await getUserDataStats(user.id);
      if (res.data.code === 200) {
        setDataUser(res.data.data.user);
        setDataStats(res.data.data.stats);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '加载数据统计失败');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser?.is_admin) return;
    loadList();
    loadMenus();
  }, [currentUser, loadList, loadMenus]);

  const openCreate = () => {
    setEditing(null);
    setCheckedMenuIds([]);
    form.setFieldsValue(defaultForm);
    setModalOpen(true);
  };

  const openEdit = async (record: SysUser) => {
    try {
      const res = await getUser(record.id);
      if (res.data.code !== 200) {
        message.error(res.data.message || '加载用户失败');
        return;
      }
      const detail = res.data.data;
      setEditing(record);
      const menuIds = detail.menu_ids ?? [];
      setCheckedMenuIds(menuIds);
      form.setFieldsValue({
        username: detail.username,
        password: '',
        nickname: detail.nickname ?? '',
        status: detail.status,
        is_admin: detail.is_admin,
        menu_ids: menuIds,
      });
      setModalOpen(true);
    } catch {
      message.error('加载用户详情失败');
    }
  };

  const openDataModal = async (record: SysUser) => {
    setDataModalOpen(true);
    setDataUser(record);
    setDataStats(null);
    await loadUserStats(record);
  };

  const openTransferModal = async (record: SysUser) => {
    setTransferFrom(record);
    setTransferToId(null);
    setTransferOpen(true);
    await loadUserStats(record);
  };

  const handleClearData = async () => {
    if (!dataUser) return;
    setDataActionLoading(true);
    try {
      const res = await clearUserData(dataUser.id);
      if (res.data.code === 200) {
        message.success('数据已清空');
        setDataStats(res.data.data.after);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '清空失败');
    } finally {
      setDataActionLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferFrom || !transferToId) {
      message.warning('请选择目标用户');
      return;
    }
    setDataActionLoading(true);
    try {
      const res = await transferUserData(transferFrom.id, transferToId);
      if (res.data.code === 200) {
        message.success('数据已转移');
        setTransferOpen(false);
        if (dataModalOpen && dataUser?.id === transferFrom.id) {
          await loadUserStats(transferFrom);
        }
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '转移失败');
    } finally {
      setDataActionLoading(false);
    }
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload: UserFormValues = {
      ...values,
      menu_ids: checkedMenuIds,
      nickname: values.nickname?.trim() || '',
    };

    if (!editing && !payload.password) {
      message.error('请设置初始密码');
      return;
    }

    setSaving(true);
    try {
      const body = editing
        ? { ...payload, ...(payload.password ? {} : { password: undefined }) }
        : payload;
      const res = editing ? await updateUser(editing.id, body) : await createUser(body);
      if (res.data.code === 200) {
        message.success(editing ? '已更新' : '已创建');
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
      const res = await deleteUser(id);
      if (res.data.code === 200) {
        message.success('已删除');
        loadList();
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '删除失败');
    }
  };

  const transferTargetOptions = useMemo(
    () =>
      list
        .filter((u) => u.id !== transferFrom?.id)
        .map((u) => ({
          value: u.id,
          label: `${u.username}${u.nickname ? `（${u.nickname}）` : ''}`,
        })),
    [list, transferFrom]
  );

  const columns: ColumnsType<SysUser> = [
    { title: '用户名', dataIndex: 'username', key: 'username', width: 120 },
    { title: '昵称', dataIndex: 'nickname', key: 'nickname', width: 120 },
    {
      title: '角色',
      dataIndex: 'is_admin',
      key: 'is_admin',
      width: 90,
      render: (v) => (Number(v) === 1 ? <Tag color="purple">管理员</Tag> : <Tag>普通用户</Tag>),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (s) => (Number(s) === 1 ? <Tag color="green">正常</Tag> : <Tag>停用</Tag>),
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" onClick={() => openDataModal(record)}>
            数据
          </Button>
          <Button type="link" size="small" onClick={() => openTransferModal(record)}>
            转移
          </Button>
          <Popconfirm title="确定删除该用户？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger disabled={record.id === currentUser?.id}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderStats = (stats: UserDataStats | null) => {
    if (!stats) return null;
    return (
      <Descriptions column={1} size="small" bordered className="user-data-stats">
        {STAT_LABELS.map(({ key, label }) => (
          <Descriptions.Item key={key} label={label}>
            {stats[key]}
          </Descriptions.Item>
        ))}
        <Descriptions.Item label="合计">{stats.total}</Descriptions.Item>
      </Descriptions>
    );
  };

  if (!currentUser?.is_admin) {
    return <div className="page-container">无权限访问用户管理</div>;
  }

  return (
    <div className="page-container system-users-page">
      <div className="system-users-toolbar">
        <Button type="primary" onClick={openCreate}>
          新增用户
        </Button>
      </div>

      <Table rowKey="id" loading={loading} columns={columns} dataSource={list} pagination={{ pageSize: 10 }} />

      <Modal
        title={editing ? '编辑用户' : '新增用户'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        destroyOnClose
        width={880}
        styles={{ body: { paddingTop: 16 } }}
      >
        <Form form={form} layout="vertical" requiredMark>
          <div className="system-users-modal-body">
            <div className="system-users-form-left">
              <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input placeholder="登录账号" disabled={Boolean(editing)} />
              </Form.Item>
              <Form.Item
                name="password"
                label={editing ? '新密码（留空不修改）' : '密码'}
                rules={editing ? [] : [{ required: true, message: '请输入密码' }, { min: 4, message: '至少 4 位' }]}
              >
                <Input.Password placeholder={editing ? '不修改请留空' : '初始密码'} />
              </Form.Item>
              <Form.Item name="nickname" label="昵称">
                <Input placeholder="显示名称" />
              </Form.Item>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select options={statusOptions} />
              </Form.Item>
              <Form.Item
                name="is_admin"
                label="管理员"
                valuePropName="checked"
                getValueFromEvent={(v) => (v ? 1 : 0)}
                getValueProps={(v) => ({ checked: Number(v) === 1 })}
              >
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>
            </div>
            <div className="system-users-form-right">
              <div className="system-users-menu-label">可访问菜单</div>
              <div className="system-users-menu-tree">
                <Tree
                  checkable
                  selectable={false}
                  defaultExpandAll
                  treeData={menuTree}
                  checkedKeys={checkedMenuIds}
                  onCheck={(keys) => {
                    const ids = (Array.isArray(keys) ? keys : keys.checked).map(Number);
                    setCheckedMenuIds(ids);
                    form.setFieldValue('menu_ids', ids);
                  }}
                />
              </div>
            </div>
          </div>
        </Form>
      </Modal>

      <Modal
        title={`用户数据 · ${dataUser?.username ?? ''}`}
        open={dataModalOpen}
        onCancel={() => setDataModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDataModalOpen(false)}>
            关闭
          </Button>,
          <Popconfirm
            key="clear"
            title="确定清空该用户全部业务数据？"
            description="将删除知识点、笔记、软件库、报表，且不可恢复"
            onConfirm={handleClearData}
            disabled={!dataStats?.total || dataUser?.id === currentUser?.id}
          >
            <Button danger loading={dataActionLoading} disabled={dataUser?.id === currentUser?.id}>
              清空数据
            </Button>
          </Popconfirm>,
        ]}
      >
        {dataLoading ? (
          <p className="user-data-loading">加载中…</p>
        ) : (
          <>
            <p className="user-data-tip">范围：知识点（分类+条目）、重要笔记、软件库、报表模板</p>
            {renderStats(dataStats)}
          </>
        )}
      </Modal>

      <Modal
        title={`转移数据 · ${transferFrom?.username ?? ''}`}
        open={transferOpen}
        onOk={handleTransfer}
        onCancel={() => setTransferOpen(false)}
        confirmLoading={dataActionLoading}
        okText="确认转移"
      >
        <p className="user-data-tip">将来源用户下列数据全部转给目标用户（来源用户数据将变为 0）</p>
        {renderStats(dataStats)}
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="目标用户" required>
            <Select
              placeholder="选择接收数据的用户"
              options={transferTargetOptions}
              value={transferToId ?? undefined}
              onChange={setTransferToId}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SystemUsers;
