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
  Tooltip
} from 'antd';
import {
  ContactsOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined
} from '@ant-design/icons';
import client from '../../api/client';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function AdvisoriesPage() {
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

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [editLoading, setEditLoading] = useState(false);
  const [selectedAdvisory, setSelectedAdvisory] = useState(null);

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
      const res = await client.get('/staff/advisories', {
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
      message.error(err.response?.data?.message || 'Không thể tải danh sách tư vấn');
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
      await client.post('/staff/advisories', values);
      message.success('Ghi nhận tư vấn khách hàng thành công');
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchData(1, pagination.pageSize);
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Lỗi khi ghi nhận tư vấn');
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditModal = (record) => {
    setSelectedAdvisory(record);
    editForm.setFieldsValue({
      status: record.status,
      notes: record.notes || ''
    });
    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedAdvisory) return;
    try {
      const values = await editForm.validateFields();
      setEditLoading(true);
      await client.put(`/staff/advisories/${selectedAdvisory.id}`, values);
      message.success('Cập nhật tiến trình tư vấn thành công');
      setEditModalOpen(false);
      editForm.resetFields();
      fetchData(pagination.current, pagination.pageSize);
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Lỗi cập nhật tư vấn');
    } finally {
      setEditLoading(false);
    }
  };

  const renderStatus = (status) => {
    switch (status) {
      case 'CONSULTED':
        return <Tag icon={<CheckCircleOutlined />} color="blue">Đã tư vấn</Tag>;
      case 'FOLLOW_UP':
        return <Tag icon={<ClockCircleOutlined />} color="gold">Cần follow-up</Tag>;
      case 'COMPLETED':
        return <Tag icon={<CheckCircleOutlined />} color="success">Đã chốt hợp đồng</Tag>;
      case 'CANCELLED':
        return <Tag color="default">Khách từ chối</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Khách hàng',
      key: 'customer',
      width: 220,
      render: (_, r) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text strong style={{ color: '#005030', fontSize: 13 }}>{r.customerName}</Text>
            <Tag color={r.customerType === 'ENTERPRISE' ? 'purple' : 'geekblue'} style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
              {r.customerType === 'ENTERPRISE' ? 'Doanh nghiệp' : 'Cá nhân'}
            </Tag>
          </div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            <div>
              <PhoneOutlined style={{ marginRight: 4, color: '#888' }} />{r.customerPhone}
            </div>
            {r.customerEmail && (
              <div style={{ marginTop: 2 }}>
                <MailOutlined style={{ marginRight: 4, color: '#888' }} />{r.customerEmail}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      title: 'Sản phẩm tư vấn',
      dataIndex: 'productType',
      key: 'productType',
      width: 240,
      render: (p) => (
        <Tooltip title={p} placement="topLeft">
          <Tag
            color="cyan"
            style={{
              fontWeight: 600,
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              lineHeight: '18px',
              padding: '4px 8px',
              maxWidth: '100%',
              display: 'inline-block',
              margin: 0,
              borderRadius: 4
            }}
          >
            {p}
          </Tag>
        </Tooltip>
      )
    },
    {
      title: 'Nội dung & Nhu cầu KH',
      dataIndex: 'notes',
      key: 'notes',
      width: 260,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text} placement="topLeft">
          <div
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
              color: '#374151',
              fontSize: 13
            }}
          >
            {text || '—'}
          </div>
        </Tooltip>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: renderStatus
    },
    {
      title: 'Chuyên viên tư vấn',
      dataIndex: 'staffName',
      key: 'staffName',
      width: 170,
      render: (name) => (
        <Tag icon={<UserOutlined />} color="green" style={{ padding: '2px 8px', borderRadius: 4 }}>
          {name}
        </Tag>
      )
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
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          style={{ color: '#005030', fontWeight: 600, padding: 0 }}
          onClick={() => openEditModal(record)}
        >
          Cập nhật
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
              <ContactsOutlined style={{ marginRight: 8 }} />
              Quản lý & Tư vấn Khách hàng (CRM Advisory)
            </Title>
            <Text type="secondary">
              Quản lý danh sách khách hàng tiềm năng, lịch sử tư vấn vay vốn, mở thẻ, gửi tiết kiệm, gói tài khoản doanh nghiệp
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
              Ghi Nhận Cuộc Tư Vấn
            </Button>
          </Col>
        </Row>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm theo tên khách hàng, SĐT, loại sản phẩm..."
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
              <Option value="CONSULTED">Đã tư vấn (CONSULTED)</Option>
              <Option value="FOLLOW_UP">Cần follow-up (FOLLOW_UP)</Option>
              <Option value="COMPLETED">Đã chốt hợp đồng (COMPLETED)</Option>
              <Option value="CANCELLED">Khách từ chối (CANCELLED)</Option>
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
          scroll={{ x: 1300 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `Tổng cộng ${total} lượt tư vấn`,
            onChange: (page, size) => fetchData(page, size)
          }}
        />
      </Card>

      {/* MODAL TẠO TƯ VẤN */}
      <Modal
        title={
          <Space>
            <ContactsOutlined style={{ color: '#005030' }} />
            <span>Ghi Nhận Hồ Sơ & Nhu Cầu Tư Vấn Mới</span>
          </Space>
        }
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleCreate}
        confirmLoading={createLoading}
        okText="Lưu Hồ Sơ"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="customerId"
            label="Khách hàng"
            rules={[{ required: true, message: 'Vui lòng chọn khách hàng' }]}
          >
            <Select
              placeholder="Chọn khách hàng được tư vấn"
              showSearch
              filterOption={(input, option) =>
                (option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {customers.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.fullName} - {c.phoneNumber} ({c.customerType})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="productType"
            label="Dịch vụ / Sản phẩm ngân hàng tư vấn"
            rules={[{ required: true, message: 'Vui lòng chọn hoặc nhập sản phẩm' }]}
          >
            <Select placeholder="Chọn gói dịch vụ tư vấn">
              <Option value="Cho vay mua ô tô (Car Loan)">Cho vay mua ô tô (Car Loan)</Option>
              <Option value="Cho vay mua nhà đất (Home Loan)">Cho vay mua nhà đất (Home Loan)</Option>
              <Option value="Vay sản xuất kinh doanh">Vay sản xuất kinh doanh</Option>
              <Option value="Thẻ tín dụng quốc tế Vietcombank Visa/Master">Thẻ tín dụng quốc tế Vietcombank Visa/Master</Option>
              <Option value="Gửi tiết kiệm có kỳ hạn lãi suất ưu đãi">Gửi tiết kiệm có kỳ hạn lãi suất ưu đãi</Option>
              <Option value="Tài khoản thanh toán số đẹp VCB Digibank">Tài khoản thanh toán số đẹp VCB Digibank</Option>
              <Option value="Gói dịch vụ VCB DigiBiz Doanh nghiệp">Gói dịch vụ VCB DigiBiz Doanh nghiệp</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái bước đầu"
            initialValue="CONSULTED"
          >
            <Select>
              <Option value="CONSULTED">Đã tư vấn qua điện thoại / quầy (CONSULTED)</Option>
              <Option value="FOLLOW_UP">Cần liên hệ lại thu thập thêm hồ sơ (FOLLOW_UP)</Option>
              <Option value="COMPLETED">Khách hàng đồng ý nộp hồ sơ (COMPLETED)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Chi tiết nhu cầu & Ghi chú trao đổi"
            rules={[{ required: true, message: 'Vui lòng nhập ghi chú tư vấn' }]}
          >
            <TextArea
              rows={4}
              placeholder="Ví dụ: Khách quan tâm vay 500tr mua xe Mazda CX-5, kỳ hạn 5 năm, thu nhập sao kê 30tr/tháng..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL CẬP NHẬT TƯ VẤN */}
      <Modal
        title={
          <Space>
            <ContactsOutlined style={{ color: '#005030' }} />
            <span>Cập Nhật Tiến Trình Tư Vấn: {selectedAdvisory?.customerName}</span>
          </Space>
        }
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleUpdate}
        confirmLoading={editLoading}
        okText="Lưu Thay Đổi"
        cancelText="Đóng"
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="status"
            label="Trạng thái tiến độ"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select>
              <Option value="CONSULTED">Đã tư vấn (CONSULTED)</Option>
              <Option value="FOLLOW_UP">Cần liên hệ follow-up lại (FOLLOW_UP)</Option>
              <Option value="COMPLETED">Đã chốt hợp đồng / Nộp hồ sơ (COMPLETED)</Option>
              <Option value="CANCELLED">Khách từ chối / Hủy nhu cầu (CANCELLED)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Cập nhật nội dung ghi chú / phản hồi của khách hàng"
            rules={[{ required: true, message: 'Vui lòng nhập ghi chú' }]}
          >
            <TextArea
              rows={4}
              placeholder="Cập nhật kết quả trao đổi, thời gian hẹn gặp..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
