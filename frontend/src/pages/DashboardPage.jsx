import { useCallback, useEffect, useState } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Empty,
  List,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowRightOutlined,
  AuditOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CustomerServiceOutlined,
  DollarOutlined,
  FileDoneOutlined,
  FundOutlined,
  GoldOutlined,
  HistoryOutlined,
  PercentageOutlined,
  ReadOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  TransactionOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import client from '../api/client';
import { useAuth } from '../store/AuthContext';

const { Title, Text, Paragraph } = Typography;

const STATUS_TAGS = {
  PENDING: { color: 'orange', label: 'Chờ duyệt' },
  DOCS_REQUIRED: { color: 'blue', label: 'Cần bổ sung' },
  APPROVED: { color: 'green', label: 'Đã duyệt' },
  REJECTED: { color: 'red', label: 'Từ chối' },
};

const TYPE_TAGS = {
  LOAN: { label: 'Vay vốn', color: 'volcano' },
  CARD_ISSUANCE: { label: 'Mở thẻ tín dụng', color: 'purple' },
  LIMIT_APPROVAL: { label: 'Duyệt hạn mức', color: 'blue' },
};

export default function DashboardPage() {
  const { user } = useAuth();

  // Role detection
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  const isManager = user?.roles?.includes('ROLE_MANAGER') || (!isAdmin && user?.permissions?.includes('APPROVE_LOAN'));
  const isStaff = user?.roles?.includes('ROLE_STAFF') || (!isAdmin && user?.permissions?.includes('STAFF_FINANCIAL_TX'));

  // Approval / Manager / Admin Metrics
  const [metrics, setMetrics] = useState({
    pendingApplications: 0,
    totalApplications: 0,
    approvedAmount: 0,
    usdSellRate: null,
    activeUsersCount: 0,
    totalPosts: 0,
  });

  // Staff Metrics
  const [staffMetrics, setStaffMetrics] = useState({
    pendingAppointments: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    totalTransactions: 0,
    totalDisputes: 0,
  });

  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Recent data
  const [recentApplications, setRecentApplications] = useState([]);
  const [recentAuditLogs, setRecentAuditLogs] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  const loadDashboardData = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const stored = JSON.parse(localStorage.getItem('ap_user') || 'null') || user;
      const adminRole = stored?.roles?.includes('ROLE_ADMIN');
      const managerRole = stored?.roles?.includes('ROLE_MANAGER') || (!adminRole && stored?.permissions?.includes('APPROVE_LOAN'));
      const staffRole = stored?.roles?.includes('ROLE_STAFF') || (!adminRole && stored?.permissions?.includes('STAFF_FINANCIAL_TX'));

      // 1. Phê duyệt & Báo cáo (Dành cho Quản lý phê duyệt & Admin)
      if (adminRole || managerRole) {
        const [appRes, repRes, fxRes] = await Promise.allSettled([
          client.get('/approvals/applications', { params: { page: 0, size: 5 } }),
          client.get('/reports/dashboard'),
          client.get('/data/exchange-rates/latest'),
        ]);

        const repData = repRes.status === 'fulfilled' ? repRes.value.data?.data : null;
        const appData = appRes.status === 'fulfilled' ? appRes.value.data?.data : null;
        const fxData = fxRes.status === 'fulfilled' ? fxRes.value.data?.data : null;
        const usd = Array.isArray(fxData) ? fxData.find((r) => r.currencyCode === 'USD') : null;

        setMetrics((prev) => ({
          ...prev,
          pendingApplications: repData?.pendingCount ?? (appData?.totalElements || 0),
          totalApplications: repData?.totalApplications ?? (appData?.totalElements || 0),
          approvedAmount: repData?.approvedAmount ?? 0,
          usdSellRate: usd ? usd.sellRate : 25450,
        }));

        if (appData?.content) setRecentApplications(appData.content);
      }

      // 2. Hệ thống, CMS, Audit log (Dành cho Admin)
      if (adminRole) {
        const [userRes, postRes, logRes] = await Promise.allSettled([
          client.get('/system/users', { params: { page: 0, size: 5 } }),
          client.get('/cms/posts', { params: { page: 0, size: 4 } }),
          client.get('/system/audit-logs', { params: { page: 0, size: 5 } }),
        ]);

        const userData = userRes.status === 'fulfilled' ? userRes.value.data?.data : null;
        const postData = postRes.status === 'fulfilled' ? postRes.value.data?.data : null;
        const logData = logRes.status === 'fulfilled' ? logRes.value.data?.data : null;

        setMetrics((prev) => ({
          ...prev,
          activeUsersCount: userData?.totalElements ?? 4,
          totalPosts: postData?.totalElements ?? 0,
        }));

        if (logData?.content) setRecentAuditLogs(logData.content);
        if (postData?.content) setRecentPosts(postData.content);
      }

      // 3. Nghiệp vụ giao dịch & Lịch hẹn Chatbot (Dành cho Nhân viên giao dịch & Admin)
      if (adminRole || staffRole) {
        const [apptStatsRes, apptListRes, txRes, dispRes] = await Promise.allSettled([
          client.get('/staff/appointments/stats'),
          client.get('/staff/appointments', { params: { page: 0, size: 5 } }),
          client.get('/staff/transactions', { params: { page: 0, size: 5 } }),
          client.get('/staff/disputes', { params: { page: 0, size: 1 } }),
        ]);

        const apptStats = apptStatsRes.status === 'fulfilled' ? apptStatsRes.value.data?.data : null;
        const apptList = apptListRes.status === 'fulfilled' ? apptListRes.value.data?.data : null;
        const txList = txRes.status === 'fulfilled' ? txRes.value.data?.data : null;
        const dispList = dispRes.status === 'fulfilled' ? dispRes.value.data?.data : null;

        setStaffMetrics({
          pendingAppointments: apptStats?.PENDING ?? 0,
          totalAppointments: apptStats?.total ?? 0,
          todayAppointments: apptStats?.today ?? 0,
          totalTransactions: txList?.totalElements ?? 0,
          totalDisputes: dispList?.totalElements ?? 0,
        });

        if (apptList?.content) setRecentAppointments(apptList.content);
        if (txList?.content) setRecentTransactions(txList.content);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoadingMetrics(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Cột bảng Hồ sơ duyệt
  const appColumns = [
    {
      title: 'Mã hồ sơ',
      dataIndex: 'applicationNumber',
      render: (num, r) => (
        <a href={`#/approvals/${r.id}`} style={{ fontWeight: 600 }}>
          {num}
        </a>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      render: (name, r) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>{r.customerCif || '-'}</Text>
        </div>
      ),
    },
    {
      title: 'Loại hồ sơ',
      dataIndex: 'applicationType',
      render: (type) => {
        const conf = TYPE_TAGS[type] || { label: type, color: 'default' };
        return <Tag color={conf.color}>{conf.label}</Tag>;
      },
    },
    {
      title: 'Số tiền / Hạn mức',
      dataIndex: 'requestedAmount',
      align: 'right',
      render: (amt) => (amt ? `${Number(amt).toLocaleString('vi-VN')} đ` : '-'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (st) => {
        const conf = STATUS_TAGS[st] || { color: 'default', label: st };
        return <Tag color={conf.color}>{conf.label}</Tag>;
      },
    },
    {
      title: 'Hành động',
      render: (_, r) => (
        <Button
          size="small"
          type="primary"
          href={`#/approvals/${r.id}`}
          style={{ background: '#005030', borderColor: '#005030', fontSize: 12 }}
        >
          Xử lý hồ sơ
        </Button>
      ),
    },
  ];

  // Cột bảng Lịch hẹn Chatbot
  const appointmentColumns = [
    {
      title: 'Mã lịch hẹn',
      dataIndex: 'appointmentCode',
      render: (code) => (
        <a href="#/staff/appointments" style={{ fontWeight: 600, color: '#005030' }}>
          {code}
        </a>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'fullName',
      render: (name, r) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>{r.phoneNumber}</Text>
        </div>
      ),
    },
    {
      title: 'Dịch vụ & Điểm hẹn',
      render: (_, r) => (
        <div>
          <Text style={{ fontSize: 12 }}>{r.serviceType}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>{r.branchName}</Text>
        </div>
      ),
    },
    {
      title: 'Thời gian hẹn',
      render: (_, r) => (
        <div>
          <Text strong style={{ fontSize: 12 }}>{r.appointmentDate}</Text>
          <br />
          <Tag color="blue" style={{ fontSize: 10, padding: '0 4px' }}>{r.timeSlot}</Tag>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (st) => {
        const colors = {
          PENDING: 'orange',
          CONFIRMED: 'blue',
          COMPLETED: 'green',
          CANCELLED: 'default',
        };
        const labels = {
          PENDING: 'Chờ tiếp nhận',
          CONFIRMED: 'Đã xác nhận',
          COMPLETED: 'Đã hoàn tất',
          CANCELLED: 'Đã hủy',
        };
        return <Tag color={colors[st] || 'default'}>{labels[st] || st}</Tag>;
      },
    },
  ];

  // Cột bảng Giao dịch tài chính
  const transactionColumns = [
    {
      title: 'Mã giao dịch',
      dataIndex: 'transactionCode',
      render: (code) => <Text code>{code}</Text>,
    },
    {
      title: 'Người nhận & STK',
      dataIndex: 'receiverName',
      render: (name, r) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>STK: {r.receiverAccountNumber}</Text>
        </div>
      ),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      align: 'right',
      render: (amt) => (
        <Text strong style={{ color: '#00482B' }}>
          {Number(amt || 0).toLocaleString('vi-VN')} đ
        </Text>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (st) => (
        <Tag color={st === 'SUCCESS' ? 'green' : 'orange'}>
          {st === 'SUCCESS' ? 'Thành công' : st}
        </Tag>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {/* Banner chào mừng phong cách Vietcombank */}
      <Card
        style={{
          background: 'linear-gradient(135deg, #005030 0%, #003820 100%)',
          color: '#fff',
          borderRadius: 8,
          border: '1px solid #73B828',
        }}
        bodyStyle={{ padding: '20px 24px' }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Title level={3} style={{ color: '#fff', margin: 0 }}>
                Xin chào, {user?.fullName || user?.username || 'Cán bộ Quản trị'} 👋
              </Title>
              {isAdmin && (
                <Tag color="#73B828" style={{ color: '#00482B', fontWeight: 'bold' }}>VIETCOMBANK ADMIN</Tag>
              )}
              {isManager && (
                <Tag color="#722ED1" style={{ color: '#fff', fontWeight: 'bold' }}>QUẢN LÝ PHÊ DUYỆT</Tag>
              )}
              {isStaff && !isAdmin && (
                <Tag color="#0284C7" style={{ color: '#fff', fontWeight: 'bold' }}>GIAO DỊCH VIÊN</Tag>
              )}
            </div>
            <Paragraph style={{ color: 'rgba(255,255,255,0.88)', margin: '6px 0 0' }}>
              Chào mừng bạn đến với Cổng điều hành Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank).
              Hôm nay là {dayjs().format('dddd, DD/MM/YYYY')}.
            </Paragraph>
          </Col>
          <Col>
            <Space>
              {/* Nút hành động nhanh theo đúng thẩm quyền nghiệp vụ */}
              {(isAdmin || isManager) && (
                <>
                  <Button
                    href="#/approvals"
                    type="primary"
                    style={{ background: '#73B828', borderColor: '#73B828', color: '#00482B', fontWeight: 600 }}
                    icon={<FileDoneOutlined />}
                  >
                    Xử lý hồ sơ
                  </Button>
                  <Button
                    href="#/reports/dashboard"
                    style={{ background: '#fff', color: '#005030', borderColor: '#fff', fontWeight: 600 }}
                    icon={<FundOutlined />}
                  >
                    Xem báo cáo
                  </Button>
                </>
              )}
              {isStaff && !isAdmin && (
                <>
                  <Button
                    href="#/staff/appointments"
                    type="primary"
                    style={{ background: '#73B828', borderColor: '#73B828', color: '#00482B', fontWeight: 600 }}
                    icon={<CalendarOutlined />}
                  >
                    Lịch hẹn Chatbot
                  </Button>
                  <Button
                    href="#/staff/transactions"
                    style={{ background: '#fff', color: '#005030', borderColor: '#fff', fontWeight: 600 }}
                    icon={<TransactionOutlined />}
                  >
                    Giao dịch tài chính
                  </Button>
                </>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* KPI Cards theo từng vai trò */}
      <Row gutter={[16, 16]}>
        {/* VIEW DÀNH CHO NHÂN VIÊN PHÊ DUYỆT (CHỈ PHÊ DUYỆT & BÁO CÁO) */}
        {isManager && (
          <>
            <Col xs={24} sm={12} lg={6}>
              <Card loading={loadingMetrics} hoverable onClick={() => (window.location.hash = '#/approvals')}>
                <Statistic
                  title="Hồ sơ chờ phê duyệt"
                  value={metrics.pendingApplications}
                  valueStyle={{ color: '#faad14', fontWeight: 'bold' }}
                  prefix={<ClockCircleOutlined />}
                  suffix="hồ sơ"
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card loading={loadingMetrics} hoverable onClick={() => (window.location.hash = '#/approvals')}>
                <Statistic
                  title="Tổng hồ sơ tiếp nhận"
                  value={metrics.totalApplications}
                  valueStyle={{ color: '#1565c0', fontWeight: 'bold' }}
                  prefix={<FileDoneOutlined />}
                  suffix="hồ sơ"
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card loading={loadingMetrics} hoverable onClick={() => (window.location.hash = '#/reports/dashboard')}>
                <Statistic
                  title="Tổng tiền đã phê duyệt"
                  value={metrics.approvedAmount}
                  precision={0}
                  valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                  prefix={<DollarOutlined />}
                  suffix="đ"
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card loading={loadingMetrics} hoverable onClick={() => (window.location.hash = '#/reports/dashboard')}>
                <Statistic
                  title="Tỷ giá USD thị trường"
                  value={metrics.usdSellRate || 25450}
                  precision={0}
                  valueStyle={{ color: '#722ed1', fontWeight: 'bold' }}
                  prefix={<DollarOutlined />}
                  suffix="VND"
                />
              </Card>
            </Col>
          </>
        )}

        {/* VIEW DÀNH CHO NHÂN VIÊN GIAO DỊCH (LỊCH HẸN & GIAO DỊCH QUẦY) */}
        {isStaff && !isAdmin && (
          <>
            <Col xs={24} sm={12} lg={6}>
              <Card loading={loadingMetrics} hoverable onClick={() => (window.location.hash = '#/staff/appointments')}>
                <Statistic
                  title="Lịch hẹn chờ tiếp nhận"
                  value={staffMetrics.pendingAppointments}
                  valueStyle={{ color: '#faad14', fontWeight: 'bold' }}
                  prefix={<CalendarOutlined />}
                  suffix="lịch"
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card loading={loadingMetrics} hoverable onClick={() => (window.location.hash = '#/staff/appointments')}>
                <Statistic
                  title="Tổng lịch hẹn Chatbot"
                  value={staffMetrics.totalAppointments}
                  valueStyle={{ color: '#0284c7', fontWeight: 'bold' }}
                  prefix={<CustomerServiceOutlined />}
                  suffix="lịch"
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card loading={loadingMetrics} hoverable onClick={() => (window.location.hash = '#/staff/transactions')}>
                <Statistic
                  title="Giao dịch tài chính"
                  value={staffMetrics.totalTransactions}
                  valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                  prefix={<TransactionOutlined />}
                  suffix="GD"
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card loading={loadingMetrics} hoverable onClick={() => (window.location.hash = '#/staff/disputes')}>
                <Statistic
                  title="Yêu cầu tra soát"
                  value={staffMetrics.totalDisputes}
                  valueStyle={{ color: '#e11d48', fontWeight: 'bold' }}
                  prefix={<AuditOutlined />}
                  suffix="yêu cầu"
                />
              </Card>
            </Col>
          </>
        )}

        {/* VIEW DÀNH CHO ADMIN (TOÀN BỘ HỆ THỐNG) */}
        {isAdmin && (
          <>
            <Col xs={24} sm={12} lg={6}>
              <Card loading={loadingMetrics} hoverable onClick={() => (window.location.hash = '#/approvals')}>
                <Statistic
                  title="Hồ sơ chờ phê duyệt"
                  value={metrics.pendingApplications}
                  valueStyle={{ color: '#faad14', fontWeight: 'bold' }}
                  prefix={<ClockCircleOutlined />}
                  suffix="hồ sơ"
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card loading={loadingMetrics} hoverable onClick={() => (window.location.hash = '#/data/exchange-rates')}>
                <Statistic
                  title="Tỷ giá USD bán ra"
                  value={metrics.usdSellRate}
                  precision={0}
                  valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                  prefix={<DollarOutlined />}
                  suffix="VND"
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card loading={loadingMetrics} hoverable onClick={() => (window.location.hash = '#/system/users')}>
                <Statistic
                  title="Nhân sự hệ thống"
                  value={metrics.activeUsersCount}
                  valueStyle={{ color: '#1565c0', fontWeight: 'bold' }}
                  prefix={<TeamOutlined />}
                  suffix="tài khoản"
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card loading={loadingMetrics} hoverable onClick={() => (window.location.hash = '#/cms/posts')}>
                <Statistic
                  title="Tin tức & CMS"
                  value={metrics.totalPosts}
                  valueStyle={{ color: '#722ed1', fontWeight: 'bold' }}
                  prefix={<ReadOutlined />}
                  suffix="bài viết"
                />
              </Card>
            </Col>
          </>
        )}
      </Row>

      {/* NỘI DUNG CHÍNH DÀNH CHO NHÂN VIÊN PHÊ DUYỆT */}
      {isManager && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  <FileDoneOutlined style={{ color: '#722ED1' }} />
                  <span>Hồ sơ nghiệp vụ chờ phê duyệt & gần đây</span>
                </Space>
              }
              extra={<a href="#/approvals">Xem tất cả hồ sơ <ArrowRightOutlined /></a>}
            >
              <Table
                rowKey="id"
                columns={appColumns}
                dataSource={recentApplications}
                pagination={false}
                size="small"
              />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <FundOutlined style={{ color: '#722ED1' }} />
                  <span>Tình trạng phê duyệt & Báo cáo</span>
                </Space>
              }
              extra={<a href="#/reports/dashboard">Báo cáo chi tiết <ArrowRightOutlined /></a>}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div style={{ background: '#FAF5FF', padding: '12px 16px', borderRadius: 8, border: '1px solid #E9D5FF' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Nhiệm vụ Quản lý phê duyệt:</Text>
                  <div style={{ marginTop: 4, fontWeight: 600, color: '#581C87', fontSize: 13 }}>
                    • Thẩm định và phê duyệt hồ sơ vay vốn, mở thẻ tín dụng.<br />
                    • Theo dõi hạn mức và xuất báo cáo nghiệp vụ định kỳ.
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>Hồ sơ chờ phê duyệt:</Text>
                    <Tag color="orange" style={{ fontWeight: 700 }}>{metrics.pendingApplications} hồ sơ</Tag>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>Tổng hồ sơ tiếp nhận:</Text>
                    <Tag color="blue" style={{ fontWeight: 700 }}>{metrics.totalApplications} hồ sơ</Tag>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>Tổng tiền đã phê duyệt:</Text>
                    <Text strong style={{ color: '#00482B' }}>
                      {Number(metrics.approvedAmount).toLocaleString('vi-VN')} đ
                    </Text>
                  </div>
                </div>

                <Button
                  type="primary"
                  block
                  href="#/approvals"
                  icon={<FileDoneOutlined />}
                  style={{ background: '#722ED1', borderColor: '#722ED1', marginTop: 8, height: 38, fontWeight: 600 }}
                >
                  Đi tới Danh sách thẩm định hồ sơ
                </Button>

                <Button
                  block
                  href="#/reports/dashboard"
                  icon={<FundOutlined />}
                  style={{ borderColor: '#722ED1', color: '#722ED1', height: 38, fontWeight: 600 }}
                >
                  Xuất file báo cáo thống kê
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      )}

      {/* NỘI DUNG CHÍNH DÀNH CHO GIAO DỊCH VIÊN */}
      {isStaff && !isAdmin && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card
              title={
                <Space>
                  <CalendarOutlined style={{ color: '#005030' }} />
                  <span>Lịch hẹn Chatbot tiếp nhận tại quầy</span>
                </Space>
              }
              extra={<a href="#/staff/appointments">Quản lý lịch hẹn <ArrowRightOutlined /></a>}
            >
              <Table
                rowKey="appointmentCode"
                columns={appointmentColumns}
                dataSource={recentAppointments}
                pagination={false}
                size="small"
              />
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card
              title={
                <Space>
                  <TransactionOutlined style={{ color: '#005030' }} />
                  <span>Giao dịch tài chính gần đây</span>
                </Space>
              }
              extra={<a href="#/staff/transactions">Thực hiện GD <ArrowRightOutlined /></a>}
            >
              <Table
                rowKey="transactionCode"
                columns={transactionColumns}
                dataSource={recentTransactions}
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* NỘI DUNG CHÍNH DÀNH CHO ADMIN */}
      {isAdmin && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={15}>
              <Card
                title={
                  <Space>
                    <FileDoneOutlined style={{ color: '#1565c0' }} />
                    <span>Hồ sơ nghiệp vụ gần đây</span>
                  </Space>
                }
                extra={<a href="#/approvals">Xem tất cả <ArrowRightOutlined /></a>}
              >
                <Table
                  rowKey="id"
                  columns={appColumns}
                  dataSource={recentApplications}
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>

            <Col xs={24} lg={9}>
              <Card
                title={
                  <Space>
                    <HistoryOutlined style={{ color: '#1565c0' }} />
                    <span>Nhật ký hệ thống mới nhất</span>
                  </Space>
                }
                extra={<a href="#/system/audit-logs">Xem thêm <ArrowRightOutlined /></a>}
              >
                <List
                  size="small"
                  dataSource={recentAuditLogs}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            size="small"
                            icon={<UserOutlined />}
                            style={{ backgroundColor: '#1565c0' }}
                          />
                        }
                        title={
                          <div style={{ fontSize: 12 }}>
                            <Text strong>{item.username}</Text>{' '}
                            <Tag color="blue" style={{ fontSize: 10, padding: '0 4px' }}>
                              {item.actionType}
                            </Tag>
                          </div>
                        }
                        description={
                          <div>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {item.description || item.moduleName}
                            </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 10 }}>
                              {dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>

          {/* Tin tức & bài viết CMS (chỉ Admin) */}
          <Card
            title={
              <Space>
                <ReadOutlined style={{ color: '#1565c0' }} />
                <span>Bài viết & Truyền thông CMS</span>
              </Space>
            }
            extra={<a href="#/cms/posts">Quản lý CMS <ArrowRightOutlined /></a>}
          >
            <Row gutter={[16, 16]}>
              {recentPosts.map((p) => (
                <Col xs={24} sm={12} md={6} key={p.id}>
                  <Card
                    size="small"
                    hoverable
                    cover={
                      p.thumbnailUrl ? (
                        <img
                          alt={p.title}
                          src={p.thumbnailUrl}
                          style={{ height: 110, objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            height: 110,
                            background: '#f0f2f5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#8c8c8c',
                          }}
                        >
                          <ReadOutlined style={{ fontSize: 24 }} />
                        </div>
                      )
                    }
                    onClick={() => (window.location.hash = '#/cms/posts')}
                  >
                    <Card.Meta
                      title={<Text strong ellipsis>{p.title}</Text>}
                      description={
                        <div>
                          <Tag color={p.status === 'PUBLISHED' ? 'green' : 'orange'}>
                            {p.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp'}
                          </Tag>
                          {p.category && <Tag color="cyan">{p.category.name}</Tag>}
                          <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>
                            {dayjs(p.createdAt).format('DD/MM/YYYY')}
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
              {!recentPosts.length && (
                <Col span={24}>
                  <Empty description="Chưa có bài viết nào" />
                </Col>
              )}
            </Row>
          </Card>
        </>
      )}
    </Space>
  );
}
