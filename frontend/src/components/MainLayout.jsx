import { useMemo, useState } from 'react';
import {
  Avatar,
  Card,
  Descriptions,
  Divider,
  Dropdown,
  Form,
  Input,
  Layout,
  Menu,
  Modal,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import client from '../api/client';
import { useAuth } from '../store/AuthContext';
import { useLanguage } from '../store/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import {
  AuditOutlined,
  BankOutlined,
  ContactsOutlined,
  CustomerServiceOutlined,
  DashboardOutlined,
  DollarOutlined,
  FileDoneOutlined,
  FundOutlined,
  GoldOutlined,
  HistoryOutlined,
  KeyOutlined,
  LockOutlined,
  LogoutOutlined,
  PercentageOutlined,
  ProfileOutlined,
  ReadOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  TransactionOutlined,
  UserOutlined,
} from '@ant-design/icons';

const { Sider, Header, Content } = Layout;
const { Text, Title } = Typography;

export default function MainLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const MENU_ITEMS = [
    { key: '/', icon: <DashboardOutlined />, label: t('common.dashboard'), permission: [] },
    { type: 'group', label: t('admin.groupStaff'), permission: ['STAFF_CUSTOMER_ADVISORY', 'STAFF_SUPPORT_TICKET', 'STAFF_DISPUTE_HANDLE', 'STAFF_FINANCIAL_TX'] },
    { key: '/staff/advisories', icon: <ContactsOutlined />, label: t('admin.menuCrm'), permission: ['STAFF_CUSTOMER_ADVISORY'] },
    { key: '/staff/disputes', icon: <AuditOutlined />, label: t('admin.menuDisputes'), permission: ['STAFF_DISPUTE_HANDLE'] },
    { key: '/staff/tickets', icon: <CustomerServiceOutlined />, label: t('admin.menuTickets'), permission: ['STAFF_SUPPORT_TICKET'] },
    { key: '/staff/transactions', icon: <TransactionOutlined />, label: t('admin.menuFinancialTx'), permission: ['STAFF_FINANCIAL_TX'] },
    { type: 'group', label: t('admin.groupData'), permission: ['DATA_UPDATE_RATES'] },
    { key: '/data/exchange-rates', icon: <DollarOutlined />, label: t('admin.menuExchangeRates'), permission: ['DATA_UPDATE_RATES'] },
    { key: '/data/gold-rates', icon: <GoldOutlined />, label: t('admin.menuGoldRates'), permission: ['DATA_UPDATE_RATES'] },
    { key: '/data/interest-rates', icon: <PercentageOutlined />, label: t('admin.menuInterestRates'), permission: ['DATA_UPDATE_RATES'] },
    { key: '/data/fee-templates', icon: <ProfileOutlined />, label: t('admin.menuFeeTemplates'), permission: ['DATA_UPDATE_RATES'] },
    { type: 'group', label: t('admin.groupApproval'), permission: ['APPROVE_LOAN'] },
    { key: '/approvals', icon: <FileDoneOutlined />, label: t('admin.menuApprovals'), permission: ['APPROVE_LOAN'] },
    { type: 'group', label: t('admin.groupReports'), permission: ['REPORT_EXPORT'] },
    { key: '/reports/dashboard', icon: <FundOutlined />, label: t('admin.menuReports'), permission: ['REPORT_EXPORT'] },
    { type: 'group', label: t('admin.groupSystem'), permission: [] },
    { key: '/system/users', icon: <TeamOutlined />, label: t('admin.menuUsers'), permission: ['SYS_MANAGE_USERS'] },
    { key: '/system/audit-logs', icon: <HistoryOutlined />, label: t('admin.menuAuditLogs'), permission: ['SYS_MANAGE_USERS'] },
    { type: 'group', label: t('admin.groupCms'), permission: ['CMS_MANAGE_POST'] },
    { key: '/cms/posts', icon: <ReadOutlined />, label: t('admin.menuPosts'), permission: ['CMS_MANAGE_POST'] },
  ];

  // Profile modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Password modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm] = Form.useForm();
  const [changingPassword, setChangingPassword] = useState(false);

  // Lọc menu theo quyền
  const visibleItems = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      if (item.type === 'group') {
        const idx = MENU_ITEMS.indexOf(item);
        const nextGroupIdx = MENU_ITEMS.findIndex((it, i) => i > idx && it.type === 'group');
        const childrenSlice = MENU_ITEMS.slice(idx + 1, nextGroupIdx === -1 ? undefined : nextGroupIdx);
        return childrenSlice.some((child) => hasPerm(child.permission));
      }
      return hasPerm(item.permission);
    });

    function hasPerm(required) {
      if (!required?.length) return true;
      const stored = JSON.parse(localStorage.getItem('ap_user') || 'null');
      if (stored?.roles?.includes('ROLE_ADMIN')) return true;
      return stored?.permissions?.some((p) => required.includes(p)) ?? false;
    }
  }, []);

  const selectedKey = window.location.hash.replace('#', '') || '/';

  const onMenuClick = ({ key }) => {
    if (key.startsWith('/')) window.location.hash = `#${key}`;
  };

  const userMenu = [
    { key: 'public_portal', icon: <BankOutlined />, label: t('admin.publicPortalView') },
    { type: 'divider' },
    { key: 'profile', icon: <UserOutlined />, label: t('admin.userProfile') },
    { key: 'password', icon: <KeyOutlined />, label: t('admin.changePassword') },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: t('common.logout'), danger: true },
  ];

  const onUserMenuClick = ({ key }) => {
    if (key === 'public_portal') window.open('#/portal', '_blank');
    if (key === 'profile') setProfileModalOpen(true);
    if (key === 'password') {
      passwordForm.resetFields();
      setPasswordModalOpen(true);
    }
    if (key === 'logout') handleLogout();
  };

  const handleLogout = () => {
    client.post('/auth/logout').catch(() => {});
    logout();
    window.location.hash = '#/login';
  };

  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      setChangingPassword(true);
      await client.put('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
      setPasswordModalOpen(false);
      handleLogout();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Không thể đổi mật khẩu');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          background: '#00482B', // Màu xanh Vietcombank Sider
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '16px 14px',
          overflow: 'hidden',
          background: '#003820',
          borderBottom: '1px solid rgba(115,184,40,0.3)'
        }}>
          <div style={{
            background: '#73B828',
            borderRadius: 6,
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00482B',
            fontWeight: 'bold',
            fontSize: 16
          }}>
            VCB
          </div>
          {!collapsed && (
            <div>
              <Text strong style={{ color: '#fff', fontSize: 14, display: 'block', lineHeight: 1.2 }}>Vietcombank</Text>
              <Text style={{ color: '#73B828', fontSize: 10, letterSpacing: 0.5 }}>ADMIN PORTAL</Text>
            </div>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          style={{ background: 'transparent' }}
          selectedKeys={[selectedKey]}
          items={visibleItems}
          onClick={onMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 20px',
          height: 'auto',
          minHeight: 64,
          lineHeight: 'normal',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px 16px',
          boxShadow: '0 1px 4px rgba(0,38,15,.08)',
          borderBottom: '2px solid #73B828'
        }}>
          <div>
            <Tag color="#005030" style={{ fontWeight: 600, fontSize: 12, padding: '2px 8px', margin: 0 }}>
              {t('admin.badge')}
            </Tag>
          </div>
          <Space size="middle" style={{ flexWrap: 'wrap' }}>
            <LanguageSwitcher size="small" />
            <a
              href="#/portal"
              target="_blank"
              rel="noreferrer"
              style={{
                color: '#005030',
                fontWeight: 600,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
              }}
            >
              <BankOutlined /> {t('admin.publicPortalView')}
            </a>
            <Divider type="vertical" style={{ height: 20 }} />
            <Dropdown menu={{ items: userMenu, onClick: onUserMenuClick }}>
              <Space style={{ cursor: 'pointer' }} size="small">
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#005030' }} />
                <Text strong style={{ color: '#005030', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.fullName || user?.username}
                </Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: 16 }}>{children}</Content>
      </Layout>

      {/* MODAL XEM PROFILE */}
      <Modal
        title={
          <Space>
            <UserOutlined style={{ color: '#1565c0' }} />
            <span>Thông tin cá nhân</span>
          </Space>
        }
        open={profileModalOpen}
        onCancel={() => setProfileModalOpen(false)}
        footer={null}
        width={550}
      >
        <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
          <Avatar size={72} icon={<UserOutlined />} style={{ backgroundColor: '#1565c0' }} />
          <Title level={4} style={{ marginTop: 12, marginBottom: 2 }}>{user?.fullName || user?.username}</Title>
          <Text type="secondary">{user?.email || 'N/A'}</Text>
        </div>

        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Tên đăng nhập">
            <Text strong>{user?.username}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Email liên hệ">
            {user?.email}
          </Descriptions.Item>
          <Descriptions.Item label="Vai trò đảm nhiệm">
            <Space wrap size={[4, 4]}>
              {(user?.roles || []).map((r) => (
                <Tag color="purple" key={r}>{r}</Tag>
              ))}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Quyền hạn">
            <Space wrap size={[4, 4]}>
              {(user?.permissions || []).map((p) => (
                <Tag color="blue" key={p} style={{ fontSize: 11 }}>{p}</Tag>
              ))}
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Modal>

      {/* MODAL ĐỔI MẬT KHẨU */}
      <Modal
        title={
          <Space>
            <KeyOutlined style={{ color: '#1565c0' }} />
            <span>Đổi mật khẩu tài khoản</span>
          </Space>
        }
        open={passwordModalOpen}
        onOk={handleChangePassword}
        onCancel={() => setPasswordModalOpen(false)}
        confirmLoading={changingPassword}
        okText="Đổi mật khẩu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={passwordForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="currentPassword"
            label="Mật khẩu hiện tại"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu đang dùng" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Tối thiểu 6 ký tự" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu mới" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
