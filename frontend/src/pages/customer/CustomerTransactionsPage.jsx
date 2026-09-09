import { useEffect, useState } from 'react';
import { Button, Card, Space, Table, Tag, Typography, message } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, HistoryOutlined, ReloadOutlined } from '@ant-design/icons';
import client, { unwrap } from '../../api/client';

const { Title, Text } = Typography;

export default function CustomerTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await unwrap(client.get('/customer/transactions'));
      setTransactions(res || []);
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể tải lịch sử giao dịch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const columns = [
    {
      title: 'Mã giao dịch',
      dataIndex: 'transactionCode',
      key: 'transactionCode',
      render: (code) => <Text strong style={{ color: '#00482B' }}>{code}</Text>,
    },
    {
      title: 'Loại GD',
      dataIndex: 'type',
      key: 'type',
      render: (t) =>
        t === 'INFLOW' ? (
          <Tag icon={<ArrowDownOutlined />} color="success">
            Nhận tiền (+)
          </Tag>
        ) : (
          <Tag icon={<ArrowUpOutlined />} color="error">
            Chuyển tiền (-)
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
      title: 'Người nhận / Người gửi',
      dataIndex: 'counterpartyName',
      key: 'counterpartyName',
      render: (n) => <Text strong>{n}</Text>,
    },
    {
      title: 'Ngân hàng',
      dataIndex: 'bankName',
      key: 'bankName',
    },
    {
      title: 'Nội dung',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Thời gian thực hiện',
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
            <HistoryOutlined /> Lịch Sử Giao Dịch Tài Khoản
          </Title>
          <Text type="secondary">
            Tra cứu biến động số dư và sao kê các giao dịch gửi / nhận tiền trực tuyến
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={loadTransactions} loading={loading}>
          Làm mới
        </Button>
      </div>

      <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
