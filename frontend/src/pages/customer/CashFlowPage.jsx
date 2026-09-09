import { useEffect, useState } from 'react';
import { Button, Card, Col, Row, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DollarOutlined,
  HistoryOutlined,
  LineChartOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import client, { unwrap } from '../../api/client';
import { useCustomerAuth } from '../../store/CustomerAuthContext';

const { Title, Text, Paragraph } = Typography;

export default function CashFlowPage() {
  const { customer } = useCustomerAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadCashFlow = async () => {
    setLoading(true);
    try {
      const res = await unwrap(client.get('/customer/cash-flow'));
      setData(res);
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể tải báo cáo dòng tiền');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCashFlow();
  }, []);

  const columns = [
    {
      title: 'Mã GD',
      dataIndex: 'transactionCode',
      key: 'transactionCode',
      render: (code) => <Text strong style={{ color: '#00482B' }}>{code}</Text>,
    },
    {
      title: 'Dòng tiền',
      dataIndex: 'type',
      key: 'type',
      render: (type) =>
        type === 'INFLOW' ? (
          <Tag icon={<ArrowDownOutlined />} color="success">
            Dòng tiền VÀO (+ Inflow)
          </Tag>
        ) : (
          <Tag icon={<ArrowUpOutlined />} color="error">
            Dòng tiền RA (- Outflow)
          </Tag>
        ),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (val, r) => (
        <Text
          strong
          style={{
            color: r.type === 'INFLOW' ? '#52c41a' : '#f5222d',
            fontSize: 14,
          }}
        >
          {r.type === 'INFLOW' ? '+' : '-'}
          {Number(val).toLocaleString('vi-VN')} đ
        </Text>
      ),
    },
    {
      title: 'Đối tác giao dịch',
      dataIndex: 'counterpartyName',
      key: 'counterpartyName',
      render: (n) => <Text strong>{n || 'Thanh toán nội bộ'}</Text>,
    },
    {
      title: 'Ngân hàng',
      dataIndex: 'bankName',
      key: 'bankName',
    },
    {
      title: 'Nội dung giao dịch',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (t) => (t ? new Date(t).toLocaleString('vi-VN') : '-'),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#00482B' }}>
            <LineChartOutlined /> Quản Lý Dòng Tiền Doanh Nghiệp (Cash Flow)
          </Title>
          <Text type="secondary">
            Báo cáo tổng hợp luồng tiền thu - chi và dòng tiền thuần của tài khoản doanh nghiệp tại Vietcombank
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={loadCashFlow} loading={loading}>
          Làm mới
        </Button>
      </div>

      {/* STATS OVERVIEW */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 10, borderLeft: '4px solid #52c41a' }}>
            <Statistic
              title="Tổng dòng tiền vào (Total Inflow)"
              value={data?.totalInflow || 0}
              formatter={(v) => `+${Number(v).toLocaleString('vi-VN')} đ`}
              valueStyle={{ color: '#52c41a' }}
              prefix={<ArrowDownOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 10, borderLeft: '4px solid #f5222d' }}>
            <Statistic
              title="Tổng dòng tiền ra (Total Outflow)"
              value={data?.totalOutflow || 0}
              formatter={(v) => `-${Number(v).toLocaleString('vi-VN')} đ`}
              valueStyle={{ color: '#f5222d' }}
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 10, borderLeft: '4px solid #00482B' }}>
            <Statistic
              title="Dòng tiền thuần (Net Cash Flow)"
              value={data?.netCashFlow || 0}
              formatter={(v) => `${Number(v).toLocaleString('vi-VN')} đ`}
              valueStyle={{ color: Number(data?.netCashFlow || 0) >= 0 ? '#00482B' : '#f5222d' }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* BẢNG GIAO DỊCH DÒNG TIỀN */}
      <Card
        title={<span style={{ color: '#00482B' }}>Chi tiết các biến động dòng tiền gần đây</span>}
        bordered={false}
        style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <Table
          columns={columns}
          dataSource={data?.recentTransactions || []}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
        />
      </Card>
    </div>
  );
}
