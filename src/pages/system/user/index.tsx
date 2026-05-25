import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
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
  createUser,
  deleteUser,
  getUser,
  getUserList,
  updateUser,
  type SysUser,
  type UserFormValues,
} from '../../../api/user';
import useAuthStore from '../../../store/authStore';
import './index.css';
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
      const res = editing
        ? await updateUser(editing.id, body)
        : await createUser(body);
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

  const columns: ColumnsType<SysUser> = [
    { title: '用户名', dataIndex: 'username', key: 'username', width: 140 },
    { title: '昵称', dataIndex: 'nickname', key: 'nickname', width: 140 },
    {
      title: '角色',
      dataIndex: 'is_admin',
      key: 'is_admin',
      width: 100,
      render: (v) => (Number(v) === 1 ? <Tag color="purple">管理员</Tag> : <Tag>普通用户</Tag>),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s) => (Number(s) === 1 ? <Tag color="green">正常</Tag> : <Tag>停用</Tag>),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该用户？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger disabled={record.id === currentUser?.id}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
    </div>
  );
};

export default SystemUsers;
