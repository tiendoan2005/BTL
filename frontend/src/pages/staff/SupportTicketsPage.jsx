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
  Timeline,
  Descriptions,
  Tooltip
} from 'antd';
import {
  CustomerServiceOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  MessageOutlined
} from '@ant-design/icons';
import client from '../../api/client';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function SupportTicketsPage() {
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

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [processForm] = Form.useForm();
  const [processLoading, setProcessLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

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
      const res = await client.get('/staff/tickets', {
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
      message.error(err.response?.data?.message || 'Không thể tải danh sách ticket CSKH');
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
      await client.post('/staff/tickets', values);
      message.success('Mở ticket CSKH thành công');
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchData(1, pagination.pageSize);
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Lỗi khi mở ticket');
    } finally {
      setCreateLoading(false);
    }
  };

  const openDetailModal = async (record) => {
    try {
      const res = await client.get(`/staff/tickets/${record.id}`);
      setSelectedTicket(res.data?.data || record);
      processForm.setFieldsValue({
        status: record.status === 'NEW' ? 'IN_PROGRESS' : record.status,
        actionNote: ''
      });
      setDetailModalOpen(true);
    } catch (err) {
      message.error('Không thể lấy chi tiết ticket');
    }
  };

  const handleProcess = async () => {
    if (!selectedTicket) return;
    try {
      const values = await processForm.validateFields();
      setProcessLoading(true);
      const res = await client.post(`/staff/tickets/${selectedTicket.id}/process`, values);
      message.success('Cập nhật xử lý ticket thành công');
      setSelectedTicket(res.data?.data);
      processForm.resetFields();
      fetchData(pagination.current, pagination.pageSize);
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Lỗi khi cập nhật ticket');
    } finally {
      setProcessLoading(false);
    }
  };

  const renderPriority = (priority) => {
    switch (priority) {
      case 'URGENT':
        return <Tag color="#f50" style={{ fontWeight: 600 }}>Khẩn cấp</Tag>;
      case 'HIGH':
        return <Tag color="volcano">Cao</Tag>;
      case 'MEDIUM':
        return <Tag color="blue">Trung bình</Tag>;
      case 'LOW':
        return <Tag color="default">Thấp</Tag>;
      default:
        return <Tag>{priority}</Tag>;
    }
  };

  const renderStatus = (status) => {
    switch (status) {
      case 'NEW':
        return <Tag icon={<ClockCircleOutlined />} color="gold">Mới tạo</Tag>;
      case 'IN_PROGRESS':
        return <Tag icon={<ReloadOutlined spin />} color="blue">Đang xử lý</Tag>;
      case 'TRANSFERRED':
        return <Tag color="purple">Chuyển phòng ban</Tag>;
      case 'RESOLVED':
        return <Tag icon={<CheckCircleOutlined />} color="success">Đã giải quyết</Tag>;
      case 'CLOSED':
        return <Tag color="default">Đã đóng</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Mã Ticket',
      dataIndex: 'ticketCode',
      key: 'ticketCode',
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
      title: 'Tiêu đề yêu cầu',
      dataIndex: 'title',
      key: 'title',
      width: 240,
      ellipsis: true,
      render: (t) => <Tooltip title={t} placement="topLeft"><Text strong>{t}</Text></Tooltip>
    },
    {
      title: 'Mức độ',
      dataIndex: 'priority',
      key: 'priority',
      width: 130,
      render: renderPriority
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: renderStatus
    },
    {
      title: 'Nhân viên phụ trách',
      dataIndex: 'assignedStaffName',
      key: 'assignedStaffName',
      width: 160,
      render: (name) => name ? <Tag icon={<UserOutlined />} color="cyan">{name}</Tag> : <Text type="secondary">Chưa gán</Text>
    },
    {
      title: 'Thời gian tạo',
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
      width: 130,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          style={{ background: '#005030', borderColor: '#005030' }}
          onClick={() => openDetailModal(record)}
        >
          Xử lý & Nhật ký
        </Button>
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
              <CustomerServiceOutlined style={{ marginRight: 8 }} />
              Hỗ trợ & Chăm sóc Khách hàng (Support Tickets)
            </Title>
            <Text type="secondary">
              Tiếp nhận sự cố ứng dụng VCB Digibank, mở khóa tài khoản, khiếu nại chất lượng dịch vụ, cập nhật nhật ký tương tác
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
              Mở Ticket Hỗ Trợ Mới
            </Button>
          </Col>
        </Row>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm theo mã ticket, tên KH, tiêu đề sự cố..."
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
              <Option value="NEW">Mới tạo (NEW)</Option>
              <Option value="IN_PROGRESS">Đang xử lý (IN_PROGRESS)</Option>
              <Option value="TRANSFERRED">Chuyển tiếp kỹ thuật (TRANSFERRED)</Option>
              <Option value="RESOLVED">Đã giải quyết (RESOLVED)</Option>
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
          scroll={{ x: 1250 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `Tổng cộng ${total} ticket hỗ trợ`,
            onChange: (page, size) => fetchData(page, size)
          }}
        />
      </Card>

      {/* MODAL MỞ TICKET */}
      <Modal
        title={
          <Space>
            <CustomerServiceOutlined style={{ color: '#005030' }} />
            <span>Tiếp Nhận & Mở Yêu Cầu Hỗ Trợ Khách Hàng (Ticket CSKH)</span>
          </Space>
        }
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleCreate}
        confirmLoading={createLoading}
        okText="Tạo Ticket"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="customerId"
            label="Khách hàng yêu cầu hỗ trợ"
            rules={[{ required: true, message: 'Vui lòng chọn khách hàng' }]}
          >
            <Select
              placeholder="Chọn khách hàng"
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
            name="priority"
            label="Mức độ ưu tiên xử lý"
            initialValue="MEDIUM"
          >
            <Select>
              <Option value="LOW">Thấp (Tư vấn thông tin chung)</Option>
              <Option value="MEDIUM">Trung bình (Hỗ trợ tài khoản/biểu phí thông thường)</Option>
              <Option value="HIGH">Cao (Lỗi đăng nhập Digibank, khóa thẻ tạm thời)</Option>
              <Option value="URGENT">Khẩn cấp (Nghi ngờ lộ OTP / giao dịch gian lận)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="Tiêu đề yêu cầu / Sự cố"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
          >
            <Input placeholder="Ví dụ: Quên mật khẩu VCB Digibank, Thẻ ATM bị nuốt tại cây..." />
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung chi tiết phản ánh của khách hàng"
            rules={[{ required: true, message: 'Vui lòng nhập nội dung sự cố' }]}
          >
            <TextArea
              rows={4}
              placeholder="Ghi nhận chi tiết mô tả lỗi, thiết bị, thời gian phát sinh của khách..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL CHI TIẾT & NHẬT KÝ TICKET */}
      <Modal
        title={
          <Space>
            <CustomerServiceOutlined style={{ color: '#005030' }} />
            <span>Tiến Trình Xử Lý Ticket: {selectedTicket?.ticketCode}</span>
          </Space>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={750}
      >
        {selectedTicket && (
          <div>
            <Descriptions size="small" bordered column={2} style={{ marginBottom: 16, marginTop: 12 }}>
              <Descriptions.Item label="Khách hàng">
                <Text strong>{selectedTicket.customerName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{selectedTicket.customerPhone}</Descriptions.Item>
              <Descriptions.Item label="Mức độ">{renderPriority(selectedTicket.priority)}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">{renderStatus(selectedTicket.status)}</Descriptions.Item>
              <Descriptions.Item label="Tiêu đề" span={2}>
                <Text strong style={{ color: '#005030' }}>{selectedTicket.title}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Nội dung ban đầu" span={2}>
                <Paragraph style={{ margin: 0 }}>{selectedTicket.content}</Paragraph>
              </Descriptions.Item>
            </Descriptions>

            <Card title="Nhật ký tương tác & Xử lý sự cố" size="small" style={{ marginBottom: 16 }}>
              {selectedTicket.logs && selectedTicket.logs.length > 0 ? (
                <Timeline style={{ marginTop: 16 }}>
                  {selectedTicket.logs.map((log) => (
                    <Timeline.Item key={log.id} color="#005030">
                      <div>
                        <Text strong style={{ color: '#005030' }}>{log.staffName}</Text>
                        <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                          {new Date(log.createdAt).toLocaleString('vi-VN')}
                        </Text>
                      </div>
                      <div style={{ marginTop: 4, background: '#f5f5f5', padding: '6px 10px', borderRadius: 4 }}>
                        {log.actionNote}
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : (
                <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: '12px 0' }}>
                  Chưa có nhật ký ghi nhận xử lý nào
                </Text>
              )}
            </Card>

            <Card title="Thêm hành động xử lý / Trả lời CSKH" size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
              <Form form={processForm} layout="vertical">
                <Form.Item
                  name="status"
                  label="Cập nhật trạng thái ticket"
                  rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                >
                  <Select>
                    <Option value="IN_PROGRESS">Đang xử lý (IN_PROGRESS)</Option>
                    <Option value="TRANSFERRED">Chuyển bộ phận Kỹ thuật / Pháp chế (TRANSFERRED)</Option>
                    <Option value="RESOLVED">Đã giải quyết xong cho khách hàng (RESOLVED)</Option>
                    <Option value="CLOSED">Đóng ticket (CLOSED)</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="actionNote"
                  label="Ghi chú hành động & Nội dung giải quyết"
                  rules={[{ required: true, message: 'Vui lòng nhập nội dung xử lý' }]}
                >
                  <TextArea
                    rows={3}
                    placeholder="Ví dụ: Đã gọi điện hướng dẫn KH cài đặt lại Smart OTP; Đã mở khóa thẻ trên hệ thống core..."
                  />
                </Form.Item>

                <Button
                  type="primary"
                  icon={<MessageOutlined />}
                  onClick={handleProcess}
                  loading={processLoading}
                  style={{ background: '#005030', borderColor: '#005030', fontWeight: 600 }}
                  block
                >
                  Lưu Tiến Trình & Cập Nhật Ticket
                </Button>
              </Form>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}
