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
  Popconfirm,
  Row,
  Col,
  Descriptions,
  Tooltip
} from 'antd';
import {
  AuditOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import client from '../../api/client';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function DisputesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);

  // Phân trang & filter
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [createLoading, setCreateLoading] = useState(false);

  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [processForm] = Form.useForm();
  const [processLoading, setProcessLoading] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);

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
      const res = await client.get('/staff/disputes', {
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
      message.error(err.response?.data?.message || 'Không thể tải danh sách tra soát');
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
      await client.post('/staff/disputes', values);
      message.success('Tạo yêu cầu tra soát thành công');
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchData(1, pagination.pageSize);
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Lỗi khi tạo tra soát');
    } finally {
      setCreateLoading(false);
    }
  };

  const openProcessModal = (record) => {
    setSelectedDispute(record);
    processForm.setFieldsValue({
      status: record.status === 'PENDING' ? 'PROCESSING' : record.status,
      resolutionNote: record.resolutionNote || ''
    });
    setProcessModalOpen(true);
  };

  const handleProcess = async () => {
    if (!selectedDispute) return;
    try {
      const values = await processForm.validateFields();
      setProcessLoading(true);
      await client.post(`/staff/disputes/${selectedDispute.id}/process`, values);
      message.success('Cập nhật xử lý tra soát thành công');
      setProcessModalOpen(false);
      processForm.resetFields();
      fetchData(pagination.current, pagination.pageSize);
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Lỗi xử lý tra soát');
    } finally {
      setProcessLoading(false);
    }
  };

  const renderStatus = (status) => {
    switch (status) {
      case 'PENDING':
        return <Tag icon={<ClockCircleOutlined />} color="gold">Chờ tiếp nhận</Tag>;
      case 'PROCESSING':
        return <Tag icon={<ReloadOutlined spin />} color="blue">Đang xử lý</Tag>;
      case 'APPROVED_REFUND':
        return <Tag icon={<CheckCircleOutlined />} color="success">Đã hoàn tiền</Tag>;
      case 'REJECTED':
        return <Tag icon={<CloseCircleOutlined />} color="error">Từ chối tra soát</Tag>;
      case 'CLOSED':
        return <Tag icon={<CheckCircleOutlined />} color="default">Đã đóng</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Mã tra soát',
      dataIndex: 'disputeCode',
      key: 'disputeCode',
      width: 140,
      render: (code) => <Text strong style={{ color: '#005030' }}>{code}</Text>
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      width: 180,
      render: (_, r) => (
        <div>
          <Text strong>{r.customerName}</Text>
          <div style={{ fontSize: 12, color: '#666' }}>SĐT: {r.customerPhone}</div>
        </div>
      )
    },
    {
      title: 'Mã GD gốc',
      dataIndex: 'transactionCode',
      key: 'transactionCode',
      width: 150,
      render: (tx) => <Tag color="geekblue">{tx}</Tag>
    },
    {
      title: 'Lý do tra soát',
      dataIndex: 'reason',
      key: 'reason',
      width: 250,
      ellipsis: true,
      render: (text) => <Tooltip title={text} placement="topLeft"><span>{text}</span></Tooltip>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: renderStatus
    },
    {
      title: 'Nhân viên xử lý',
      dataIndex: 'handlerStaffName',
      key: 'handlerStaffName',
      width: 160,
      render: (name) => name ? <Tag icon={<UserOutlined />} color="cyan">{name}</Tag> : <Text type="secondary">Chưa gán</Text>
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (d) => (
        <span style={{ fontSize: 12, color: '#4b5563' }}>
          {d ? new Date(d).toLocaleString('vi-VN') : '—'}
        </span>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            style={{ background: '#005030', borderColor: '#005030' }}
            onClick={() => openProcessModal(record)}
          >
            Xử lý
          </Button>
        </Space>
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
              <AuditOutlined style={{ marginRight: 8 }} />
              Xử lý Yêu cầu Tra soát Giao dịch (Dispute Resolution)
            </Title>
            <Text type="secondary">
              Tiếp nhận, thẩm tra khiếu nại, hoàn tiền hoặc phản hồi tranh chấp giao dịch thanh toán
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
              Tạo Tra Soát Mới
            </Button>
          </Col>
        </Row>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm theo mã tra soát, mã GD hoặc tên KH..."
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
              <Option value="PENDING">Chờ tiếp nhận (PENDING)</Option>
              <Option value="PROCESSING">Đang xử lý (PROCESSING)</Option>
              <Option value="APPROVED_REFUND">Đã hoàn tiền (APPROVED_REFUND)</Option>
              <Option value="REJECTED">Từ chối (REJECTED)</Option>
              <Option value="CLOSED">Đã đóng (CLOSED)</Option>
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
          scroll={{ x: 1200 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `Tổng cộng ${total} yêu cầu tra soát`,
            onChange: (page, size) => fetchData(page, size)
          }}
        />
      </Card>

      {/* MODAL TẠO TRA SOÁT */}
      <Modal
        title={
          <Space>
            <AuditOutlined style={{ color: '#005030' }} />
            <span>Mở Yêu Cầu Tra Soát Giao Dịch Mới</span>
          </Space>
        }
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleCreate}
        confirmLoading={createLoading}
        okText="Tạo Yêu Cầu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="customerId"
            label="Khách hàng yêu cầu"
            rules={[{ required: true, message: 'Vui lòng chọn khách hàng' }]}
          >
            <Select
              placeholder="Chọn khách hàng khiếu nại"
              showSearch
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

          <Form.Item
            name="transactionCode"
            label="Mã giao dịch phát sinh lỗi"
            rules={[{ required: true, message: 'Vui lòng nhập mã giao dịch gốc' }]}
          >
            <Input placeholder="Ví dụ: TXN-2026-00129 hoặc FT260819928" />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Lý do tra soát & Chi tiết khiếu nại"
            rules={[{ required: true, message: 'Vui lòng nhập chi tiết lý do khiếu nại' }]}
          >
            <TextArea
              rows={4}
              placeholder="Mô tả sự việc: Bị trừ tiền 2 lần, chuyển tiền người thụ hưởng chưa nhận được, cây ATM không nhả tiền..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL XỬ LÝ TRA SOÁT */}
      <Modal
        title={
          <Space>
            <AuditOutlined style={{ color: '#005030' }} />
            <span>Xử Lý Tra Soát: {selectedDispute?.disputeCode}</span>
          </Space>
        }
        open={processModalOpen}
        onCancel={() => setProcessModalOpen(false)}
        onOk={handleProcess}
        confirmLoading={processLoading}
        okText="Lưu Kết Quả Xử Lý"
        cancelText="Đóng"
        width={600}
      >
        {selectedDispute && (
          <Descriptions size="small" bordered column={1} style={{ marginBottom: 16, marginTop: 12 }}>
            <Descriptions.Item label="Khách hàng">
              <Text strong>{selectedDispute.customerName}</Text> ({selectedDispute.customerPhone})
            </Descriptions.Item>
            <Descriptions.Item label="Mã giao dịch">{selectedDispute.transactionCode}</Descriptions.Item>
            <Descriptions.Item label="Lý do">{selectedDispute.reason}</Descriptions.Item>
            <Descriptions.Item label="Ngày tiếp nhận">
              {new Date(selectedDispute.createdAt).toLocaleString('vi-VN')}
            </Descriptions.Item>
          </Descriptions>
        )}

        <Form form={processForm} layout="vertical">
          <Form.Item
            name="status"
            label="Cập nhật trạng thái xử lý"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select>
              <Option value="PROCESSING">Đang thẩm tra / Đối soát liên ngân hàng (PROCESSING)</Option>
              <Option value="APPROVED_REFUND">Chấp thuận tra soát - Hoàn tiền khách hàng (APPROVED_REFUND)</Option>
              <Option value="REJECTED">Từ chối khiếu nại - Giao dịch hợp lệ (REJECTED)</Option>
              <Option value="CLOSED">Đã hoàn tất đóng hồ sơ tra soát (CLOSED)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="resolutionNote"
            label="Ghi chú kết quả đối soát & xử lý"
            rules={[{ required: true, message: 'Vui lòng nhập kết quả xử lý' }]}
          >
            <TextArea
              rows={4}
              placeholder="Nhập nội dung biên bản giải trình, mã điện đối soát Napas/Visa, số tiền hoàn trả..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
