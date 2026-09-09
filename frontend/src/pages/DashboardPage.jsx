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
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileDoneOutlined,
  FundOutlined,
  GoldOutlined,
  HistoryOutlined,
  PercentageOutlined,
  ReadOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
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

  // Metrics state
  const [metrics, setMetrics] = useState({
    pendingApplications: 0,
    totalApplications: 0,
    approvedAmount: 0,
    usdSellRate: null,
    goldSellRate: null,
    activeUsersCount: 0,
    totalPosts: 0,
  });
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Recent data
  const [recentApplications, setRecentApplications] = useState([]);
  const [recentAuditLogs, setRecentAuditLogs] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);

  const loadDashboardData = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const [appRes, repRes, userRes, postRes, logRes, fxRes] = await Promise.allSettled([
        client.get('/approvals/applications', { params: { page: 0, size: 5 } }),
        client.get('/reports/dashboard'),
        client.get('/system/users', { params: { page: 0, size: 5 } }),
        client.get('/cms/posts', { params: { page: 0, size: 4 } }),
        client.get('/system/audit-logs', { params: { page: 0, size: 5 } }),
        client.get('/data/exchange-rates/latest'),
      ]);

      const repData = repRes.status === 'fulfilled' ? repRes.value.data?.data : null;
      const appData = appRes.status === 'fulfilled' ? appRes.value.data?.data : null;
      const userData = userRes.status === 'fulfilled' ? userRes.value.data?.data : null;
      const postData = postRes.status === 'fulfilled' ? postRes.value.data?.data : null;
      const logData = logRes.status === 'fulfilled' ? logRes.value.data?.data : null;
      const fxData = fxRes.status === 'fulfilled' ? fxRes.value.data?.data : null;

      const usd = Array.isArray(fxData) ? fxData.find((r) => r.currencyCode === 'USD') : null;

      setMetrics({
        pendingApplications: repData?.pendingCount ?? (appData?.totalElements || 0),
        totalApplications: repData?.totalApplications ?? 0,
        approvedAmount: repData?.approvedAmount ?? 0,
        usdSellRate: usd ? usd.sellRate : 25450,
        activeUsersCount: userData?.totalElements ?? 3,
        totalPosts: postData?.totalElements ?? 0,
      });

      if (appData?.content) setRecentApplications(appData.content);
      if (logData?.content) setRecentAuditLogs(logData.content);
      if (postData?.content) setRecentPosts(postData.content);
    } catch (e) {
      // ignore
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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
      title: 'Loại',
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
              <Tag color="#73B828" style={{ color: '#00482B', fontWeight: 'bold' }}>VIETCOMBANK ADMIN</Tag>
            </div>
            <Paragraph style={{ color: 'rgba(255,255,255,0.88)', margin: '6px 0 0' }}>
              Chào mừng bạn đến với Cổng điều hành Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank).
              Hôm nay là {dayjs().format('dddd, DD/MM/YYYY')}.
            </Paragraph>
          </Col>
          <Col>
            <Space>
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
            </Space>
          </Col>
        </Row>
      </Card>

      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
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
      </Row>

      {/* 2 Blocks: Hồ sơ mới nhất & Nhật ký thao tác */}
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

      {/* Tin tức & bài viết CMS */}
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
    </Space>
  );
}
