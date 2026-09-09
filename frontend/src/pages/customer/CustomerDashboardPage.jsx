import { useEffect, useState } from 'react';
import { Button, Card, Col, Divider, Row, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import {
  BankOutlined,
  CreditCardOutlined,
  DollarOutlined,
  FileDoneOutlined,
  HistoryOutlined,
  LineChartOutlined,
  PlusCircleOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useCustomerAuth } from '../../store/CustomerAuthContext';
import { useLanguage } from '../../store/LanguageContext';
import client, { unwrap } from '../../api/client';

const { Title, Text, Paragraph } = Typography;

export default function CustomerDashboardPage() {
  const { customer, isIndividual, isEnterprise } = useCustomerAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState([]);
  const [savings, setSavings] = useState([]);
  const [tradeFinance, setTradeFinance] = useState([]);
  const [cashFlow, setCashFlow] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Hồ sơ đã nộp
      const apps = await unwrap(client.get('/customer/my-applications')).catch(() => []);
      setApplications(apps || []);

      // 2. Tiết kiệm online
      const sav = await unwrap(client.get('/customer/savings')).catch(() => []);
      setSavings(sav || []);

      // 3. Nghiệp vụ DN
      if (isEnterprise) {
        const tf = await unwrap(client.get('/customer/trade-finance')).catch(() => []);
        setTradeFinance(tf || []);

        const cf = await unwrap(client.get('/customer/cash-flow')).catch(() => null);
        setCashFlow(cf);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalSavingsAmount = savings.reduce(
    (acc, s) => acc + (s.status === 'ACTIVE' ? Number(s.depositAmount || 0) : 0),
    0
  );

  return (
    <div>
      {/* BANNER CHÀO MỪNG */}
      <Card
        bordered={false}
        style={{
          background: 'linear-gradient(135deg, #00482B 0%, #006038 50%, #003820 100%)',
          borderRadius: 12,
          color: '#fff',
          marginBottom: 20,
          boxShadow: '0 4px 16px rgba(0,72,43,0.2)',
        }}
      >
        <Row align="middle" justify="space-between">
          <Col xs={24} md={16}>
            <Tag color="#73B828" style={{ color: '#00482B', fontWeight: 'bold', marginBottom: 8 }}>
              {isIndividual ? t('customer.individual').toUpperCase() : t('customer.enterprise').toUpperCase()}
            </Tag>
            <Title level={3} style={{ color: '#fff', margin: 0 }}>
              {t('customer.welcome')}, {customer?.fullName || customer?.username}!
            </Title>
            <Paragraph style={{ color: '#d0ebd5', marginTop: 6, marginBottom: 0, fontSize: 13 }}>
              {isIndividual
                ? t('customer.individualSubtitle')
                : t('customer.enterpriseSubtitle')}
            </Paragraph>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right', marginTop: 12 }}>
            <Button
              type="primary"
              size="large"
              style={{ background: '#73B828', borderColor: '#73B828', color: '#00482B', fontWeight: 'bold' }}
              onClick={() => (window.location.hash = '#/customer/my-applications')}
            >
              {t('customer.menuMyApplications')} ({applications.length}) <RightOutlined />
            </Button>
          </Col>
        </Row>
      </Card>

      {/* STATS OVERVIEW */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 10, borderLeft: '4px solid #00482B' }}>
            <Statistic
              title={t('customer.statTotalApps')}
              value={applications.length}
              prefix={<FileDoneOutlined style={{ color: '#00482B' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 10, borderLeft: '4px solid #73B828' }}>
            <Statistic
              title={t('customer.statPendingApps')}
              value={applications.filter((a) => a.status === 'PENDING').length}
              valueStyle={{ color: '#d46b08' }}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 10, borderLeft: '4px solid #13c2c2' }}>
            <Statistic
              title={t('customer.statSavingsBalance')}
              value={totalSavingsAmount}
              precision={0}
              formatter={(v) => `${Number(v).toLocaleString('vi-VN')} đ`}
              prefix={<SafetyCertificateOutlined style={{ color: '#13c2c2' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 10, borderLeft: '4px solid #722ed1' }}>
            {isEnterprise && cashFlow ? (
              <Statistic
                title={t('customer.statNetCashFlow')}
                value={cashFlow.netCashFlow || 0}
                formatter={(v) => `${Number(v).toLocaleString('vi-VN')} đ`}
                valueStyle={{ color: Number(cashFlow.netCashFlow) >= 0 ? '#52c41a' : '#f5222d' }}
                prefix={<LineChartOutlined />}
              />
            ) : (
              <Statistic
                title={t('customer.statApprovedApps')}
                value={applications.filter((a) => a.status === 'APPROVED').length}
                valueStyle={{ color: '#52c41a' }}
                prefix={<BankOutlined />}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* DỊCH VỤ NHANH */}
      <Title level={4} style={{ color: '#00482B', marginBottom: 12 }}>
        {t('customer.quickServices')}
      </Title>

      {isIndividual && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              style={{ borderRadius: 10, textAlign: 'center', height: '100%' }}
              onClick={() => (window.location.hash = '#/customer/loans/consumer')}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: '#e6f4ea',
                  color: '#00482B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  margin: '0 auto 12px',
                }}
              >
                <DollarOutlined />
              </div>
              <Text strong style={{ fontSize: 15, display: 'block' }}>
                Vay tiêu dùng
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Lãi suất từ 9.5%/năm, hạn mức tới 500 triệu
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              style={{ borderRadius: 10, textAlign: 'center', height: '100%' }}
              onClick={() => (window.location.hash = '#/customer/loans/auto')}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: '#e6f4ea',
                  color: '#00482B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  margin: '0 auto 12px',
                }}
              >
                <ThunderboltOutlined />
              </div>
              <Text strong style={{ fontSize: 15, display: 'block' }}>
                Vay mua ô tô
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Hỗ trợ 80% giá trị xe, thời hạn vay tới 8 năm
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              style={{ borderRadius: 10, textAlign: 'center', height: '100%' }}
              onClick={() => (window.location.hash = '#/customer/cards')}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: '#e6f4ea',
                  color: '#00482B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  margin: '0 auto 12px',
                }}
              >
                <CreditCardOutlined />
              </div>
              <Text strong style={{ fontSize: 15, display: 'block' }}>
                Mở thẻ tín dụng
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Visa Platinum, miễn lãi tới 45 ngày, tích điểm
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              style={{ borderRadius: 10, textAlign: 'center', height: '100%' }}
              onClick={() => (window.location.hash = '#/customer/savings')}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: '#e6f4ea',
                  color: '#00482B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  margin: '0 auto 12px',
                }}
              >
                <SafetyCertificateOutlined />
              </div>
              <Text strong style={{ fontSize: 15, display: 'block' }}>
                Tiết kiệm Online
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Lãi suất hấp dẫn lên tới 6.8%/năm, rút gốc linh hoạt
              </Text>
            </Card>
          </Col>
        </Row>
      )}

      {isEnterprise && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              style={{ borderRadius: 10, textAlign: 'center', height: '100%' }}
              onClick={() => (window.location.hash = '#/customer/loans/business')}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: '#e6f7ff',
                  color: '#1890ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  margin: '0 auto 12px',
                }}
              >
                <SolutionOutlined />
              </div>
              <Text strong style={{ fontSize: 15, display: 'block' }}>
                Vay SXKD Doanh nghiệp
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Hạn mức linh hoạt, lãi suất chỉ từ 7.8%/năm
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              style={{ borderRadius: 10, textAlign: 'center', height: '100%' }}
              onClick={() => (window.location.hash = '#/customer/trade-finance')}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: '#e6f7ff',
                  color: '#1890ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  margin: '0 auto 12px',
                }}
              >
                <SwapOutlined />
              </div>
              <Text strong style={{ fontSize: 15, display: 'block' }}>
                Tài trợ thương mại & L/C
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Phát hành bảo lãnh & Thư tín dụng quốc tế
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              style={{ borderRadius: 10, textAlign: 'center', height: '100%' }}
              onClick={() => (window.location.hash = '#/customer/cash-flow')}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: '#e6f7ff',
                  color: '#1890ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  margin: '0 auto 12px',
                }}
              >
                <LineChartOutlined />
              </div>
              <Text strong style={{ fontSize: 15, display: 'block' }}>
                Quản lý dòng tiền Cash Flow
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Báo cáo thu - chi theo thời gian thực
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              style={{ borderRadius: 10, textAlign: 'center', height: '100%' }}
              onClick={() => (window.location.hash = '#/customer/savings')}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: '#e6f7ff',
                  color: '#1890ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  margin: '0 auto 12px',
                }}
              >
                <SafetyCertificateOutlined />
              </div>
              <Text strong style={{ fontSize: 15, display: 'block' }}>
                Tiền gửi sinh lời DN
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Tối ưu hóa nguồn vốn nhàn rỗi doanh nghiệp
              </Text>
            </Card>
          </Col>
        </Row>
      )}

      {/* DANH SÁCH HỒ SƠ GẦN ĐÂY */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <FileDoneOutlined style={{ color: '#00482B' }} />
              <span>Hồ sơ yêu cầu dịch vụ gần nhất</span>
            </Space>
            <Button type="link" onClick={() => (window.location.hash = '#/customer/my-applications')}>
              Xem tất cả →
            </Button>
          </div>
        }
        bordered={false}
        style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <Table
          dataSource={applications.slice(0, 5)}
          rowKey="id"
          pagination={false}
          columns={[
            {
              title: 'Mã hồ sơ',
              dataIndex: 'applicationCode',
              render: (c) => <Text strong style={{ color: '#00482B' }}>{c}</Text>,
            },
            {
              title: 'Nghiệp vụ',
              dataIndex: 'purposeOrDetail',
            },
            {
              title: 'Số tiền đề xuất',
              dataIndex: 'requestedAmount',
              align: 'right',
              render: (v) => (v ? `${Number(v).toLocaleString('vi-VN')} đ` : '-'),
            },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              render: (s) => (
                <Tag color={s === 'APPROVED' ? 'success' : s === 'PENDING' ? 'gold' : 'orange'}>{s}</Tag>
              ),
            },
            {
              title: 'Thời gian',
              dataIndex: 'createdAt',
              render: (t) => (t ? new Date(t).toLocaleDateString('vi-VN') : '-'),
            },
          ]}
        />
      </Card>
    </div>
  );
}
