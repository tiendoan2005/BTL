import { useState } from 'react';
import {
  Avatar,
  Card,
  Descriptions,
  Divider,
  Dropdown,
  Layout,
  Menu,
  Modal,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  BankOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  DollarOutlined,
  FileDoneOutlined,
  FundOutlined,
  HistoryOutlined,
  HomeOutlined,
  LineChartOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useCustomerAuth } from '../store/CustomerAuthContext';
import { useLanguage } from '../store/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import client, { unwrap } from '../api/client';

const { Sider, Header, Content } = Layout;
const { Text, Title } = Typography;

export default function CustomerLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { customer, isIndividual, isEnterprise, logoutCustomer } = useCustomerAuth();
  const { t } = useLanguage();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Menu dựa trên Loại khách hàng (Cá nhân vs Doanh nghiệp)
  const menuItems = [
    { key: '/customer/dashboard', icon: <DashboardOutlined />, label: t('customer.menuDashboard') },
    { type: 'divider' },
    ...(isIndividual
      ? [
          { type: 'group', label: t('customer.groupPersonal') },
          { key: '/customer/loans/consumer', icon: <DollarOutlined />, label: t('customer.menuConsumerLoan') },
          { key: '/customer/loans/auto', icon: <CarIconOutlined />, label: t('customer.menuAutoLoan') },
          { key: '/customer/cards', icon: <CreditCardOutlined />, label: t('customer.menuCards') },
          { key: '/customer/savings', icon: <SafetyCertificateOutlined />, label: t('customer.menuSavings') },
        ]
      : []),
    ...(isEnterprise
      ? [
          { type: 'group', label: t('customer.groupEnterprise') },
          { key: '/customer/loans/business', icon: <SolutionOutlined />, label: t('customer.menuBusinessLoan') },
          { key: '/customer/trade-finance', icon: <SwapOutlined />, label: t('customer.menuTradeFinance') },
          { key: '/customer/cash-flow', icon: <LineChartOutlined />, label: t('customer.menuCashFlow') },
          { key: '/customer/savings', icon: <SafetyCertificateOutlined />, label: t('customer.menuEnterpriseSavings') },
        ]
      : []),
    { type: 'divider' },
    { type: 'group', label: t('customer.groupUtilities') },
    { key: '/customer/my-applications', icon: <FileDoneOutlined />, label: t('customer.menuMyApplications') },
    { key: '/customer/transactions', icon: <HistoryOutlined />, label: t('customer.menuTransactions') },
  ];

  const selectedKey = window.location.hash.replace('#', '') || '/customer/dashboard';

  const onMenuClick = ({ key }) => {
    if (key.startsWith('/')) window.location.hash = `#${key}`;
  };

  const handleLogout = () => {
    logoutCustomer();
    message.success('Đã đăng xuất khỏi Cổng khách hàng');
    window.location.hash = '#/customer/login';
  };

  const loadProfile = async () => {
    setLoadingProfile(true);
    try {
      const data = await unwrap(client.get('/customer/profile'));
      setProfileData(data);
      setProfileModalOpen(true);
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể tải thông tin khách hàng');
    } finally {
      setLoadingProfile(false);
    }
  };

  const userMenu = [
    { key: 'portal_home', icon: <HomeOutlined />, label: t('portal.customerPortalLink') },
    { type: 'divider' },
    { key: 'profile', icon: <UserOutlined />, label: t('customer.profileInfo') },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: t('common.logout'), danger: true },
  ];

  const onUserMenuClick = ({ key }) => {
    if (key === 'portal_home') {
      window.location.hash = '#/portal';
    }
    if (key === 'profile') loadProfile();
    if (key === 'logout') handleLogout();
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={260}
        style={{
          background: '#00482B',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '16px 14px',
            background: '#003820',
            borderBottom: '1px solid rgba(115,184,40,0.3)',
          }}
        >
          <div
            style={{
              background: '#73B828',
              borderRadius: 6,
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00482B',
              fontWeight: '900',
              fontSize: 16,
            }}
          >
            VCB
          </div>
          {!collapsed && (
            <div>
              <Text strong style={{ color: '#fff', fontSize: 13, display: 'block', lineHeight: 1.2 }}>
                {t('customer.portalTitle')}
              </Text>
              <Tag color={isIndividual ? 'green' : 'blue'} style={{ fontSize: 10, marginTop: 4, marginInlineEnd: 0 }}>
                {isIndividual ? t('customer.individual').toUpperCase() : t('customer.enterprise').toUpperCase()}
              </Tag>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          style={{ background: 'transparent', marginTop: 8 }}
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={onMenuClick}
        />
      </Sider>

      <Layout>
        <Header
          style={{
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
            borderBottom: '2px solid #73B828',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 16, color: '#00482B', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {t('customer.digitalService')}
            </span>
            <Tag color="#73B828" style={{ color: '#00482B', fontWeight: 600, margin: 0 }}>
              VCB e-Banking
            </Tag>
          </div>

          <Space size="middle" style={{ flexWrap: 'wrap' }}>
            <LanguageSwitcher size="small" />
            <a
              href="#/portal"
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
              <HomeOutlined /> {t('portal.customerPortalLink')}
            </a>
            <Divider type="vertical" style={{ height: 20 }} />
            <Dropdown menu={{ items: userMenu, onClick: onUserMenuClick }}>
              <Space style={{ cursor: 'pointer' }} size="small">
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#005030' }} />
                <div style={{ lineHeight: 1.2 }}>
                  <Text strong style={{ color: '#005030', display: 'block', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {customer?.fullName || customer?.username}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {customer?.username} ({customer?.customerType})
                  </Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ margin: 18, minHeight: 280 }}>{children}</Content>
      </Layout>

      {/* MODAL CHI TIẾT HỒ SƠ KHÁCH HÀNG */}
      <Modal
        title={
          <Space>
            <SolutionOutlined style={{ color: '#005030' }} />
            <span>Thông tin hồ sơ khách hàng</span>
          </Space>
        }
        open={profileModalOpen}
        onCancel={() => setProfileModalOpen(false)}
        footer={null}
        width={650}
        loading={loadingProfile}
      >
        {profileData && (
          <div>
            <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
              <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: '#005030' }} />
              <Title level={4} style={{ marginTop: 10, marginBottom: 2, color: '#005030' }}>
                {profileData.fullName}
              </Title>
              <Tag color={profileData.customerType === 'INDIVIDUAL' ? 'green' : 'blue'}>
                {profileData.customerType === 'INDIVIDUAL' ? 'Khách hàng cá nhân' : 'Khách hàng doanh nghiệp'}
              </Tag>
            </div>

            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Tên đăng nhập">
                <Text strong>{profileData.username}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color="success">{profileData.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="CMND/CCCD/ĐKKD">
                {profileData.idCardNumber || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {profileData.phoneNumber || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Email liên hệ" span={2}>
                {profileData.email || 'N/A'}
              </Descriptions.Item>

              {profileData.individual && (
                <>
                  <Descriptions.Item label="Ngày sinh">
                    {profileData.individual.dateOfBirth || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Giới tính">
                    {profileData.individual.gender || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Thu nhập hàng tháng">
                    <Text strong style={{ color: '#005030' }}>
                      {profileData.individual.monthlyIncome
                        ? `${Number(profileData.individual.monthlyIncome).toLocaleString('vi-VN')} VNĐ`
                        : 'N/A'}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Công ty / Chức vụ">
                    {profileData.individual.companyName} ({profileData.individual.position})
                  </Descriptions.Item>
                </>
              )}

              {profileData.enterprise && (
                <>
                  <Descriptions.Item label="Mã số thuế">
                    <Text strong>{profileData.enterprise.taxCode}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Người đại diện PL">
                    {profileData.enterprise.representativeName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tên công ty" span={2}>
                    {profileData.enterprise.companyName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Vốn điều lệ" span={2}>
                    <Text strong style={{ color: '#005030' }}>
                      {profileData.enterprise.charterCapital
                        ? `${Number(profileData.enterprise.charterCapital).toLocaleString('vi-VN')} VNĐ`
                        : 'N/A'}
                    </Text>
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>
    </Layout>
  );
}

function CarIconOutlined() {
  return <ThunderboltOutlined />;
}
