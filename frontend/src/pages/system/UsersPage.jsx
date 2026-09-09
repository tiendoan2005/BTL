import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  KeyOutlined,
  LockOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  TeamOutlined,
  UnlockOutlined,
  UserAddOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import client from '../../api/client';
import { useAuth } from '../../store/AuthContext';
import { extractError } from '../data/ratesHelpers';

const { Text } = Typography;

const STATUS_TAGS = {
  ACTIVE: { color: 'green', label: 'Hoạt động' },
  INACTIVE: { color: 'default', label: 'Tạm ngưng' },
  LOCKED: { color: 'red', label: 'Đã khóa' },
};

const MODULE_COLORS = {
  System: 'blue',
  FluctuatingData: 'gold',
  Approval: 'purple',
  Report: 'cyan',
  CMS: 'magenta',
  StaffModule: 'geekblue',
};

const MODULE_LABELS = {
  System: 'Hệ thống',
  FluctuatingData: 'Dữ liệu biến động',
  Approval: 'Phê duyệt',
  Report: 'Báo cáo',
  CMS: 'Nội dung CMS',
  StaffModule: 'Nghiệp vụ chi nhánh',
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  // ---------- Dữ liệu chung ----------
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);

  // ---------- Tab Users ----------
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userPage, setUserPage] = useState(0);
  const [userPageSize, setUserPageSize] = useState(10);
  const [userTotal, setUserTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState(undefined);

  // Modal User
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null = tạo mới
  const [userForm] = Form.useForm();
  const [savingUser, setSavingUser] = useState(false);

  // ---------- Tab Roles ----------
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm] = Form.useForm();
  const [savingRole, setSavingRole] = useState(false);

  // Load danh mục roles + permissions
  const loadMeta = useCallback(async () => {
    try {
      const [rRes, pRes] = await Promise.all([
        client.get('/system/roles', { params: { page: 0, size: 50 } }),
        client.get('/system/roles/permissions'),
      ]);
      setRoles(rRes.data?.data?.content || []);
      setAllPermissions(pRes.data?.data || []);
    } catch (err) {
      message.error('Không thể tải danh mục quyền: ' + extractError(err));
    }
  }, []);

  // Load danh sách users
  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = { page: userPage, size: userPageSize };
      if (keyword.trim()) params.keyword = keyword.trim();
      if (statusFilter) params.status = statusFilter;
      const res = await client.get('/system/users', { params });
      const data = res.data?.data;
      setUsers(data?.content || []);
      setUserTotal(data?.totalElements || 0);
    } catch (err) {
      message.error(extractError(err));
    } finally {
      setUsersLoading(false);
    }
  }, [userPage, userPageSize, keyword, statusFilter]);

  // Load danh sách roles (đầy đủ phân trang)
  const loadRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const res = await client.get('/system/roles', { params: { page: 0, size: 50 } });
      setRoles(res.data?.data?.content || []);
    } catch (err) {
      message.error(extractError(err));
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => { loadMeta(); }, [loadMeta]);
  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ==================== XỬ LÝ USER ====================

  const openCreateUser = () => {
    setEditingUser(null);
    userForm.resetFields();
    userForm.setFieldsValue({ status: 'ACTIVE', roleIds: [] });
    setUserModalOpen(true);
  };

  const openEditUser = (record) => {
    setEditingUser(record);
    userForm.resetFields();
    userForm.setFieldsValue({
      username: record.username,
      fullName: record.fullName,
      email: record.email,
      phoneNumber: record.phoneNumber,
      status: record.status,
      roleIds: (record.roles || []).map((r) => r.id),
      newPassword: '',
    });
    setUserModalOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      const values = await userForm.validateFields();
      setSavingUser(true);
      if (editingUser) {
        // Cập nhật
        const payload = {
          fullName: values.fullName,
          email: values.email,
          phoneNumber: values.phoneNumber,
          status: values.status,
          roleIds: values.roleIds,
        };
        if (values.newPassword?.trim()) {
          payload.newPassword = values.newPassword.trim();
        }
        await client.put(`/system/users/${editingUser.id}`, payload);
        message.success(`Đã cập nhật tài khoản ${editingUser.username}`);
      } else {
        // Tạo mới
        await client.post('/system/users', {
          username: values.username.trim(),
          password: values.password,
          email: values.email.trim(),
          fullName: values.fullName.trim(),
          phoneNumber: values.phoneNumber,
          roleIds: values.roleIds,
        });
        message.success(`Đã tạo tài khoản ${values.username}`);
      }
      setUserModalOpen(false);
      loadUsers();
      loadRoles(); // cập nhật userCount
    } catch (err) {
      if (err.errorFields) return; // antd validation
      message.error(extractError(err));
    } finally {
      setSavingUser(false);
    }
  };

  const handleChangeStatus = async (user, nextStatus) => {
    try {
      await client.patch(`/system/users/${user.id}/status`, null, {
        params: { status: nextStatus },
      });
      message.success(`Đã đổi trạng thái tài khoản ${user.username} thành ${STATUS_TAGS[nextStatus]?.label}`);
      loadUsers();
    } catch (err) {
      message.error(extractError(err));
    }
  };

  const handleDeleteUser = async (user) => {
    try {
      await client.delete(`/system/users/${user.id}`);
      message.success(`Đã xóa tài khoản ${user.username}`);
      loadUsers();
      loadRoles();
    } catch (err) {
      message.error(extractError(err));
    }
  };

  // ==================== XỬ LÝ ROLE ====================

  const openCreateRole = () => {
    setEditingRole(null);
    roleForm.resetFields();
    roleForm.setFieldsValue({ permissionIds: [] });
    setRoleModalOpen(true);
  };

  const openEditRole = (record) => {
    setEditingRole(record);
    roleForm.resetFields();
    roleForm.setFieldsValue({
      name: record.name,
      description: record.description,
      permissionIds: (record.permissions || []).map((p) => p.id),
    });
    setRoleModalOpen(true);
  };

  const handleSaveRole = async () => {
    try {
      const values = await roleForm.validateFields();
      setSavingRole(true);
      if (editingRole) {
        await client.put(`/system/roles/${editingRole.id}`, {
          name: values.name,
          description: values.description,
          permissionIds: values.permissionIds || [],
        });
        message.success(`Đã cập nhật vai trò ${editingRole.code}`);
      } else {
        const res = await client.post('/system/roles', {
          name: values.name,
          description: values.description,
          permissionIds: values.permissionIds || [],
        });
        message.success(`Đã tạo vai trò ${res.data?.data?.code}`);
      }
      setRoleModalOpen(false);
      loadRoles();
      loadMeta();
    } catch (err) {
      if (err.errorFields) return;
      message.error(extractError(err));
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = async (role) => {
    try {
      await client.delete(`/system/roles/${role.id}`);
      message.success(`Đã xóa vai trò ${role.code}`);
      loadRoles();
      loadMeta();
    } catch (err) {
      message.error(extractError(err));
    }
  };

  // Nhóm danh mục quyền theo Module
  const permsByModule = useMemo(() => {
    const groups = {};
    for (const p of allPermissions) {
      const m = p.moduleName || 'Khác';
      if (!groups[m]) groups[m] = [];
      groups[m].push(p);
    }
    return groups;
  }, [allPermissions]);

  // ==================== COLUMNS ====================

  const userColumns = [
    {
      title: 'Tài khoản',
      key: 'user',
      width: 220,
      render: (_, r) => (
        <Space orientation="horizontal" align="center">
          <Avatar
            style={{
              backgroundColor: r.status === 'LOCKED' ? '#ff4d4f' : '#1565c0',
            }}
            icon={<UserOutlined />}
          />
          <div>
            <Text strong>{r.username}</Text>
            {currentUser?.id === r.id && (
              <Tag color="blue" style={{ marginLeft: 6 }}>Bạn</Tag>
            )}
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{r.fullName}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Liên hệ',
      key: 'contact',
      width: 240,
      render: (_, r) => (
        <div>
          <Text>{r.email}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{r.phoneNumber || '-'}</Text>
        </div>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'roles',
      width: 220,
      render: (roleList) => (
        <Space wrap size={[4, 4]}>
          {(roleList || []).map((ro) => (
            <Tag key={ro.id} color="purple">{ro.name || ro.code}</Tag>
          ))}
          {!roleList?.length && <Text type="secondary">(Chưa gán)</Text>}
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 130,
      render: (st) => {
        const cfg = STATUS_TAGS[st] || { color: 'default', label: st };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Lần đăng nhập cuối',
      dataIndex: 'lastLogin',
      width: 170,
      render: (v) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : <Text type="secondary">Chưa từng</Text>),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, r) => {
        const isSelf = currentUser?.id === r.id;
        const isLocked = r.status === 'LOCKED';
        return (
          <Space orientation="horizontal" size="small">
            <Tooltip title="Sửa thông tin / vai trò">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => openEditUser(r)}
              />
            </Tooltip>

            <Tooltip title={isSelf ? 'Không thể tự khóa tài khoản của mình' : isLocked ? 'Mở khóa' : 'Khóa tài khoản'}>
              <Popconfirm
                title={isLocked ? `Mở khóa cho ${r.username}?` : `Khóa tài khoản ${r.username}?`}
                description={isLocked ? 'Người dùng sẽ có thể đăng nhập trở lại.' : 'Người dùng sẽ bị chặn đăng nhập ngay lập tức.'}
                onConfirm={() => handleChangeStatus(r, isLocked ? 'ACTIVE' : 'LOCKED')}
                disabled={isSelf}
                okText="Đồng ý"
                cancelText="Hủy"
              >
                <Button
                  type="text"
                  danger={!isLocked}
                  disabled={isSelf}
                  icon={isLocked ? <UnlockOutlined style={{ color: '#52c41a' }} /> : <LockOutlined />}
                />
              </Popconfirm>
            </Tooltip>

            <Tooltip title={isSelf ? 'Không thể tự xóa tài khoản của mình' : 'Xóa tài khoản'}>
              <Popconfirm
                title={`Xóa vĩnh viễn tài khoản ${r.username}?`}
                description="Hành động này không thể hoàn tác."
                onConfirm={() => handleDeleteUser(r)}
                disabled={isSelf}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="text"
                  danger
                  disabled={isSelf}
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  const roleColumns = [
    {
      title: 'Mã vai trò',
      dataIndex: 'code',
      width: 180,
      render: (code) => <Text code strong>{code}</Text>,
    },
    {
      title: 'Tên vai trò',
      dataIndex: 'name',
      width: 180,
      render: (name, r) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{r.description || '-'}</Text>
        </div>
      ),
    },
    {
      title: 'Nhân sự',
      dataIndex: 'userCount',
      width: 100,
      align: 'center',
      render: (cnt) => (
        <Badge
          count={cnt || 0}
          showZero
          style={{ backgroundColor: cnt > 0 ? '#1677ff' : '#d9d9d9' }}
        />
      ),
    },
    {
      title: 'Danh sách quyền đã gán',
      dataIndex: 'permissions',
      render: (perms) => {
        if (!perms?.length) return <Text type="secondary">(Chưa có quyền nào)</Text>;
        return (
          <Space wrap size={[4, 4]}>
            {perms.map((p) => {
              const fullPerm = allPermissions.find((ap) => ap.id === p.id || ap.code === p.code);
              const mod = fullPerm?.moduleName || 'System';
              return (
                <Tooltip key={p.id || p.code} title={`${fullPerm?.name || p.code} (${MODULE_LABELS[mod] || mod})`}>
                  <Tag color={MODULE_COLORS[mod] || 'blue'}>
                    {fullPerm?.name || p.code}
                  </Tag>
                </Tooltip>
              );
            })}
          </Space>
        );
      },
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, r) => {
        const inUse = (r.userCount || 0) > 0;
        return (
          <Space orientation="horizontal" size="small">
            <Tooltip title="Sửa vai trò & phân quyền">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => openEditRole(r)}
              />
            </Tooltip>
            <Tooltip title={inUse ? `Đang có ${r.userCount} tài khoản mang vai trò này - không thể xóa` : 'Xóa vai trò'}>
              <Popconfirm
                title={`Xóa vai trò ${r.code}?`}
                disabled={inUse}
                onConfirm={() => handleDeleteRole(r)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="text"
                  danger
                  disabled={inUse}
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        items={[
          {
            key: 'users',
            label: (
              <span>
                <TeamOutlined /> Quản lý tài khoản
              </span>
            ),
            children: (
              <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                {/* Filter bar */}
                <Card size="small">
                  <Row gutter={[12, 12]} justify="space-between" align="middle">
                    <Col xs={24} md={16}>
                      <Space wrap>
                        <Input
                          placeholder="Tìm username, họ tên, email..."
                          prefix={<SearchOutlined />}
                          allowClear
                          style={{ width: 260 }}
                          value={keyword}
                          onChange={(e) => setKeyword(e.target.value)}
                          onPressEnter={loadUsers}
                        />
                        <Select
                          placeholder="Trạng thái"
                          allowClear
                          style={{ width: 150 }}
                          value={statusFilter}
                          onChange={setStatusFilter}
                          options={[
                            { value: 'ACTIVE', label: 'Hoạt động' },
                            { value: 'INACTIVE', label: 'Tạm ngưng' },
                            { value: 'LOCKED', label: 'Đã khóa' },
                          ]}
                        />
                        <Button icon={<SearchOutlined />} type="primary" onClick={loadUsers}>
                          Tìm kiếm
                        </Button>
                        <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(''); setStatusFilter(undefined); loadUsers(); }}>
                          Làm mới
                        </Button>
                      </Space>
                    </Col>
                    <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                      <Button
                        type="primary"
                        icon={<UserAddOutlined />}
                        onClick={openCreateUser}
                      >
                        Thêm tài khoản
                      </Button>
                    </Col>
                  </Row>
                </Card>

                {/* Users Table */}
                <Card size="small">
                  <Table
                    rowKey="id"
                    columns={userColumns}
                    dataSource={users}
                    loading={usersLoading}
                    pagination={{
                      current: userPage + 1,
                      pageSize: userPageSize,
                      total: userTotal,
                      showSizeChanger: true,
                      showTotal: (total) => `Tổng số ${total} tài khoản`,
                      onChange: (p, ps) => {
                        setUserPage(p - 1);
                        setUserPageSize(ps);
                      },
                    }}
                    scroll={{ x: 1100 }}
                  />
                </Card>
              </Space>
            ),
          },
          {
            key: 'roles',
            label: (
              <span>
                <SafetyCertificateOutlined /> Vai trò & Phân quyền (RBAC)
              </span>
            ),
            children: (
              <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                <Card size="small">
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Text type="secondary">
                        Mỗi vai trò bao gồm một tập hợp các quyền cụ thể. Quyền quyết định các chức năng và menu được phép truy cập.
                      </Text>
                    </Col>
                    <Col>
                      <Space>
                        <Button icon={<ReloadOutlined />} onClick={loadRoles}>Làm mới</Button>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={openCreateRole}
                        >
                          Thêm vai trò mới
                        </Button>
                      </Space>
                    </Col>
                  </Row>
                </Card>

                <Card size="small">
                  <Table
                    rowKey="id"
                    columns={roleColumns}
                    dataSource={roles}
                    loading={rolesLoading}
                    pagination={false}
                  />
                </Card>
              </Space>
            ),
          },
        ]}
      />

      {/* Modal Thêm/Sửa Tài khoản */}
      <Modal
        title={editingUser ? `Chỉnh sửa tài khoản: ${editingUser.username}` : 'Thêm tài khoản nhân sự mới'}
        open={userModalOpen}
        onOk={handleSaveUser}
        onCancel={() => setUserModalOpen(false)}
        confirmLoading={savingUser}
        destroyOnClose
        width={560}
        okText={editingUser ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form form={userForm} layout="vertical" style={{ marginTop: 16 }}>
          {!editingUser && (
            <Form.Item
              name="username"
              label="Tên đăng nhập"
              rules={[
                { required: true, message: 'Vui lòng nhập tên đăng nhập' },
                { pattern: /^[a-zA-Z0-9._-]+$/, message: 'Chỉ gồm chữ, số, dấu chấm và gạch ngang' },
              ]}
            >
              <Input placeholder="VD: nguyen_van_a" />
            </Form.Item>
          )}

          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input placeholder="VD: Nguyễn Văn A" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' },
                ]}
              >
                <Input placeholder="a.nguyen@bank.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phoneNumber" label="Số điện thoại">
                <Input placeholder="0901234567" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="roleIds"
            label="Vai trò đảm nhiệm"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 vai trò' }]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn một hoặc nhiều vai trò"
              options={roles.map((r) => ({
                value: r.id,
                label: `${r.name} (${r.code})`,
              }))}
            />
          </Form.Item>

          {editingUser && (
            <Form.Item name="status" label="Trạng thái tài khoản">
              <Select
                disabled={currentUser?.id === editingUser.id}
                options={[
                  { value: 'ACTIVE', label: 'Hoạt động' },
                  { value: 'INACTIVE', label: 'Tạm ngưng' },
                  { value: 'LOCKED', label: 'Đã khóa' },
                ]}
              />
            </Form.Item>
          )}

          {!editingUser ? (
            <Form.Item
              name="password"
              label="Mật khẩu ban đầu"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu' },
                { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
              ]}
            >
              <Input.Password placeholder="Tối thiểu 6 ký tự" />
            </Form.Item>
          ) : (
            <Form.Item
              name="newPassword"
              label="Đặt lại mật khẩu mới (bỏ trống nếu không đổi)"
              rules={[{ min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' }]}
            >
              <Input.Password placeholder="Nhập mật khẩu mới nếu muốn reset" prefix={<KeyOutlined />} />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Modal Thêm/Sửa Vai trò & Phân quyền */}
      <Modal
        title={editingRole ? `Chỉnh sửa vai trò: ${editingRole.code}` : 'Tạo vai trò mới'}
        open={roleModalOpen}
        onOk={handleSaveRole}
        onCancel={() => setRoleModalOpen(false)}
        confirmLoading={savingRole}
        destroyOnClose
        width={680}
        okText={editingRole ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form form={roleForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Tên vai trò"
            rules={[{ required: true, message: 'Vui lòng nhập tên vai trò' }]}
          >
            <Input placeholder="VD: Chuyên viên thẩm định tín dụng" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả chức năng">
            <Input.TextArea rows={2} placeholder="Mô tả quyền hạn và phạm vi công việc..." />
          </Form.Item>

          <Divider orientation="left" style={{ margin: '12px 0' }}>
            <SafetyCertificateOutlined /> Phân quyền chi tiết theo Module
          </Divider>

          <Form.Item name="permissionIds" valuePropName="value">
            <PermissionSelector permsByModule={permsByModule} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

/** Component chọn danh sách quyền dạng Checkbox grouped theo Module. */
function PermissionSelector({ value = [], onChange, permsByModule = {} }) {
  const selectedSet = new Set(value);

  const toggleOne = (id) => {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange?.([...next]);
  };

  const toggleModule = (modulePerms, allChecked) => {
    const next = new Set(selectedSet);
    for (const p of modulePerms) {
      if (allChecked) next.delete(p.id);
      else next.add(p.id);
    }
    onChange?.([...next]);
  };

  return (
    <div style={{ maxHeight: 360, overflowY: 'auto', paddingRight: 8 }}>
      {Object.entries(permsByModule).map(([mod, pList]) => {
        const allChecked = pList.every((p) => selectedSet.has(p.id));
        const someChecked = pList.some((p) => selectedSet.has(p.id)) && !allChecked;

        return (
          <Card
            key={mod}
            size="small"
            style={{ marginBottom: 12, background: '#fafafa' }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Checkbox
                  indeterminate={someChecked}
                  checked={allChecked}
                  onChange={() => toggleModule(pList, allChecked)}
                >
                  <Text strong>{MODULE_LABELS[mod] || mod}</Text>
                  <Tag color={MODULE_COLORS[mod] || 'blue'} style={{ marginLeft: 8 }}>
                    {pList.filter((p) => selectedSet.has(p.id)).length}/{pList.length}
                  </Tag>
                </Checkbox>
              </div>
            }
          >
            <Row gutter={[12, 8]}>
              {pList.map((p) => (
                <Col span={12} key={p.id}>
                  <Checkbox
                    checked={selectedSet.has(p.id)}
                    onChange={() => toggleOne(p.id)}
                  >
                    <div>
                      <Text style={{ fontSize: 13 }}>{p.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>{p.code}</Text>
                    </div>
                  </Checkbox>
                </Col>
              ))}
            </Row>
          </Card>
        );
      })}
    </div>
  );
}
