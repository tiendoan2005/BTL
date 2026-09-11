import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Modal,
  Form,
  Card,
  Typography,
  message,
  Row,
  Col,
  InputNumber,
  Descriptions,
  Divider,
  Alert
} from 'antd';
import {
  TransactionOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  SendOutlined,
  UserOutlined,
  BankOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import client from '../../api/client';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function FinancialTransactionsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);

  // Phân trang & filter
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal thực hiện giao dịch
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [createLoading, setCreateLoading] = useState(false);

  // Modal xác nhận xem biên lai
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [createdTxn, setCreatedTxn] = useState(null);

  const fetchCustomers = async () => {
    try {
      const res = await client.get('/staff/customers');
      setCustomers(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = useCallback(async (page = 1, size = 10) => {
    setLoading(true);
    try {
      const res = await client.get('/staff/transactions', {
        params: {
          page: page - 1,
          size,
          keyword: keyword || undefined,
          status: statusFilter || undefined
        }
      });
      const pageData = res.data?.data;
      setData(pageData?.content || []);
      setPagination({
        current: (pageData?.page || 0) + 1,
        pageSize: pageData?.size || 10,
        total: pageData?.totalElements || 0
      });
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể tải danh sách giao dịch');
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter]);

  useEffect(() => {
    fetchCustomers();
    fetchData(1, pagination.pageSize);
  }, []);

  const handleSearch = () => {
    fetchData(1, pagination.pageSize);
  };

  const handleReset = () => {
    setKeyword('');
    setStatusFilter('');
    setTimeout(() => {
      fetchData(1, pagination.pageSize);
    }, 50);
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setCreateLoading(true);
      const res = await client.post('/staff/transactions', values);
      message.success('Thực hiện giao dịch tài chính thành công!');
      setCreatedTxn(res.data?.data);
      setCreateModalOpen(false);
      createForm.resetFields();
      setReceiptModalOpen(true);
      fetchData(1, pagination.pageSize);
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Lỗi khi thực hiện giao dịch');
    } finally {
      setCreateLoading(false);
    }
  };

  const columns = [
    {
      title: 'Mã GD (Core Banking)',
      dataIndex: 'transactionCode',
      key: 'transactionCode',
      width: 170,
      render: (code) => <Text strong style={{ color: '#005030' }}>{code}</Text>
    },
    {
      title: 'Người gửi / Nộp tiền',
      dataIndex: 'senderCustomerName',
      key: 'senderCustomerName',
      width: 180,
      render: (name) => <Text strong>{name}</Text>
    },
    {
      title: 'Người thụ hưởng',
      key: 'receiver',
      width: 220,
      render: (_, r) => (
        <div>
          <Text strong>{r.receiverName}</Text>
          <div style={{ fontSize: 12, color: '#666' }}>STK: {r.receiverAccountNumber} ({r.bankName})</div>
        </div>
      )
    },
    {
      title: 'Số tiền GD (VND)',
      dataIndex: 'amount',
      key: 'amount',
      width: 160,
      align: 'right',
      render: (amt) => (
        <Text strong style={{ color: '#005030', fontSize: 14 }}>
          {Number(amt || 0).toLocaleString('vi-VN')} ₫
        </Text>
      )
    },
    {
      title: 'Phí GD',
      dataIndex: 'fee',
      key: 'fee',
      width: 110,
      align: 'right',
      render: (f) => <Text type="secondary">{Number(f || 0).toLocaleString('vi-VN')} ₫</Text>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (st) => (
        <Tag icon={<CheckCircleOutlined />} color="success">
          {st === 'SUCCESS' ? 'Thành công' : st}
        </Tag>
      )
    },
    {
      title: 'Giao dịch viên',
      dataIndex: 'staffName',
      key: 'staffName',
      width: 160,
      render: (name) => <Tag icon={<UserOutlined />} color="cyan">{name}</Tag>
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (d) => (
        <span style={{ fontSize: 12, color: '#4b5563' }}>
          {d ? new Date(d).toLocaleString('vi-VN') : '—'}
        </span>
      )
    }
  ];

  return (
    <div>
      <Card
        style={{ marginBottom: 16, borderTop: '4px solid #005030' }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Title level={4} style={{ margin: 0, color: '#005030' }}>
              <TransactionOutlined style={{ marginRight: 8 }} />
              Xử lý Giao dịch Tài chính & Quầy (Financial Transactions)
            </Title>
            <Text type="secondary">
              Thực hiện & xác minh các lệnh chuyển tiền liên ngân hàng Napas, nộp rút tiền mặt tại quầy, phát hành ủy nhiệm chi
            </Text>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ background: '#73B828', borderColor: '#73B828', fontWeight: 600 }}
              onClick={() => {
                createForm.resetFields();
                setCreateModalOpen(true);
              }}
            >
              Lập Lệnh Chuyển / Nộp Tiền
            </Button>
          </Col>
        </Row>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm theo mã giao dịch, số tài khoản, người thụ hưởng..."
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Lọc theo trạng thái"
              value={statusFilter || undefined}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="SUCCESS">Thành công (SUCCESS)</Option>
              <Option value="PENDING">Chờ duyệt (PENDING)</Option>
              <Option value="FAILED">Thất bại (FAILED)</Option>
            </Select>
          </Col>
          <Col xs={24} sm={4} md={6}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} style={{ background: '#005030' }}>
                Tìm kiếm
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          tableLayout="fixed"
          scroll={{ x: 1260 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `Tổng cộng ${total} giao dịch`,
            onChange: (page, size) => fetchData(page, size)
          }}
        />
      </Card>

      {/* MODAL LẬP LỆNH GIAO DỊCH TÀI CHÍNH */}
      <Modal
        title={
          <Space>
            <TransactionOutlined style={{ color: '#005030' }} />
            <span>Lập Lệnh Chuyển Tiền / Nộp Tiền Tại Quầy Vietcombank</span>
          </Space>
        }
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleCreate}
        confirmLoading={createLoading}
        okText="Xác Nhận Thực Hiện Giao Dịch"
        cancelText="Hủy"
        width={650}
        destroyOnClose
      >
        <Alert
          message="Giao dịch viên lưu ý"
          description="Kiểm tra kỹ CCCD/Hộ chiếu và đối soát tên người thụ hưởng trước khi nhấn xác nhận chuyển tiền."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form form={createForm} layout="vertical">
          <Form.Item
            name="senderCustomerId"
            label="Khách hàng trích tiền / Nộp tiền"
          >
            <Select
              placeholder="Chọn khách hàng trích tài khoản (để trống nếu nộp tiền mặt tại quầy)"
              showSearch
              allowClear
              filterOption={(input, option) =>
                (option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {customers.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.fullName} - {c.phoneNumber} ({c.idCardNumber})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="bankName"
                label="Ngân hàng thụ hưởng"
                initialValue="VIETCOMBANK"
                rules={[{ required: true, message: 'Vui lòng chọn ngân hàng' }]}
              >
                <Select>
                  <Option value="VIETCOMBANK">Ngoại thương Việt Nam (Vietcombank)</Option>
                  <Option value="BIDV">Đầu tư và Phát triển VN (BIDV)</Option>
                  <Option value="VIETINBANK">Công thương Việt Nam (VietinBank)</Option>
                  <Option value="AGRIBANK">Nông nghiệp & PTNT (Agribank)</Option>
                  <Option value="TECHCOMBANK">Kỹ thương Việt Nam (Techcombank)</Option>
                  <Option value="MBBANK">Quân đội (MBBank)</Option>
                  <Option value="VPBANK">Việt Nam Thịnh Vượng (VPBank)</Option>
                  <Option value="ACB">Á Châu (ACB)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="receiverAccountNumber"
                label="Số tài khoản thụ hưởng"
                rules={[{ required: true, message: 'Vui lòng nhập số tài khoản thụ hưởng' }]}
              >
                <Input placeholder="Ví dụ: 0011004129999" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="receiverName"
            label="Tên chủ tài khoản thụ hưởng (In hoa không dấu)"
            rules={[{ required: true, message: 'Vui lòng nhập tên người nhận' }]}
          >
            <Input placeholder="NGUYEN VAN B" style={{ textTransform: 'uppercase' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="amount"
                label="Số tiền chuyển (VND)"
                rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  min={1000}
                  step={100000}
                  placeholder="1,000,000"
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="fee"
                label="Phí giao dịch (VND)"
                initialValue={0}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Nội dung chuyển tiền"
            initialValue="Chuyen tien thanh toan tai quay VCB"
          >
            <TextArea rows={2} placeholder="Nội dung giao dịch..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL BIÊN LAI IN GIAO DỊCH */}
      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
            <span>Biên Lai Giao Dịch Thành Công</span>
          </Space>
        }
        open={receiptModalOpen}
        onCancel={() => setReceiptModalOpen(false)}
        footer={[
          <Button key="close" type="primary" style={{ background: '#005030' }} onClick={() => setReceiptModalOpen(false)}>
            Hoàn tất & In biên lai
          </Button>
        ]}
        width={550}
      >
        {createdTxn && (
          <div style={{ padding: '8px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Text strong style={{ color: '#005030', fontSize: 18, display: 'block' }}>
                NGÂN HÀNG TMCP NGOẠI THƯƠNG VIỆT NAM (VIETCOMBANK)
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>GIẤY NỘP TIỀN / LỆNH CHUYỂN TIỀN TẠI QUẦY</Text>
              <div style={{ marginTop: 8 }}>
                <Tag color="green" style={{ fontSize: 13, padding: '2px 10px' }}>
                  MÃ GD: {createdTxn.transactionCode}
                </Tag>
              </div>
            </div>

            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Người nộp / Trích TK">
                <Text strong>{createdTxn.senderCustomerName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Người thụ hưởng">
                <Text strong>{createdTxn.receiverName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Số TK thụ hưởng">
                {createdTxn.receiverAccountNumber} ({createdTxn.bankName})
              </Descriptions.Item>
              <Descriptions.Item label="Số tiền chuyển">
                <Text strong style={{ color: '#005030', fontSize: 16 }}>
                  {Number(createdTxn.amount || 0).toLocaleString('vi-VN')} VND
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Phí giao dịch">
                {Number(createdTxn.fee || 0).toLocaleString('vi-VN')} VND
              </Descriptions.Item>
              <Descriptions.Item label="Nội dung">
                {createdTxn.description}
              </Descriptions.Item>
              <Descriptions.Item label="Giao dịch viên thực hiện">
                {createdTxn.staffName}
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian giao dịch">
                {new Date(createdTxn.createdAt).toLocaleString('vi-VN')}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
}
