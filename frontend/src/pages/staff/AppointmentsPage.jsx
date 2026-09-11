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
  Descriptions,
  Divider,
  DatePicker,
  Badge,
  Tooltip,
  Alert
} from 'antd';
import {
  CalendarOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  UserOutlined,
  PhoneOutlined,
  BankOutlined,
  CommentOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import client from '../../api/client';
import { useAuth } from '../../store/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const STATUS_CONFIG = {
  PENDING: {
    label: 'Chờ tiếp đón',
    color: 'gold',
    icon: <ClockCircleOutlined />
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    color: 'processing',
    icon: <CheckCircleOutlined />
  },
  COMPLETED: {
    label: 'Đã hoàn tất',
    color: 'success',
    icon: <CheckCircleOutlined />
  },
  CANCELLED: {
    label: 'Đã hủy',
    color: 'error',
    icon: <CloseCircleOutlined />
  }
};

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    TOTAL: 0,
    PENDING: 0,
    CONFIRMED: 0,
    COMPLETED: 0,
    CANCELLED: 0
  });

  // Phân trang & bộ lọc
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal Cập nhật trạng thái
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [statusForm] = Form.useForm();
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Modal Chi tiết
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);

  // Modal Tạo mới lịch hẹn thủ công
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [creating, setCreating] = useState(false);

  // Tải thống kê
  const fetchStats = async () => {
    try {
      const res = await client.get('/staff/appointments/stats');
      if (res.data?.data) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Không thể tải thống kê lịch hẹn:', err);
    }
  };

  // Tải danh sách lịch hẹn
  const fetchData = useCallback(async (page = 1, size = 10) => {
    setLoading(true);
    try {
      const res = await client.get('/staff/appointments', {
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
      message.error(err.response?.data?.message || 'Không thể tải danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter]);

  useEffect(() => {
    fetchStats();
    fetchData(1, pagination.pageSize);
  }, []);

  const handleSearch = () => {
    fetchData(1, pagination.pageSize);
  };

  const handleReset = () => {
    setKeyword('');
    setStatusFilter('');
    setTimeout(() => {
      setLoading(true);
      client.get('/staff/appointments', { params: { page: 0, size: pagination.pageSize } })
        .then((res) => {
          const pageData = res.data?.data;
          setData(pageData?.content || []);
          setPagination({
            current: 1,
            pageSize: pageData?.size || 10,
            total: pageData?.totalElements || 0
          });
        })
        .finally(() => setLoading(false));
    }, 0);
  };

  const handleTableChange = (newPagination) => {
    fetchData(newPagination.current, newPagination.pageSize);
  };

  // Mở modal cập nhật trạng thái
  const openStatusModal = (record) => {
    setSelectedAppointment(record);
    statusForm.setFieldsValue({
      status: record.status,
      handlerNote: record.handlerNote || ''
    });
    setStatusModalOpen(true);
  };

  // Xử lý submit cập nhật trạng thái
  const handleUpdateStatus = async (values) => {
    if (!selectedAppointment) return;
    setUpdatingStatus(true);
    try {
      await client.put(`/staff/appointments/${selectedAppointment.id}/status`, values);
      message.success('Cập nhật trạng thái lịch hẹn thành công!');
      setStatusModalOpen(false);
      fetchData(pagination.current, pagination.pageSize);
      fetchStats();
    } catch (err) {
      message.error(err.response?.data?.message || 'Cập nhật trạng thái thất bại');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Mở modal xem chi tiết
  const openDetailModal = (record) => {
    setDetailData(record);
    setDetailModalOpen(true);
  };

  // Xử lý tạo lịch hẹn tại quầy
  const handleCreateAppointment = async (values) => {
    setCreating(true);
    try {
      const payload = {
        fullName: values.fullName,
        phoneNumber: values.phoneNumber,
        email: values.email || null,
        branchName: values.branchName,
        serviceType: values.serviceType,
        appointmentDate: values.appointmentDate ? values.appointmentDate.format('YYYY-MM-DD') : null,
        timeSlot: values.timeSlot,
        note: values.note || null
      };
      await client.post('/staff/appointments', payload);
      message.success('Tạo lịch hẹn thành công!');
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchData(1, pagination.pageSize);
      fetchStats();
    } catch (err) {
      message.error(err.response?.data?.message || 'Tạo lịch hẹn thất bại');
    } finally {
      setCreating(false);
    }
  };

  const columns = [
    {
      title: 'Mã lịch hẹn',
      dataIndex: 'appointmentCode',
      key: 'appointmentCode',
      width: 170,
      render: (code) => (
        <span style={{ fontWeight: 700, color: '#005030', fontFamily: 'monospace' }}>
          {code}
        </span>
      )
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      width: 220,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1f1f1f' }}>
            <UserOutlined style={{ marginRight: 6, color: '#005030' }} />
            {r.fullName}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            <PhoneOutlined style={{ marginRight: 6, color: '#888' }} />
            {r.phoneNumber}
          </div>
          {r.email && (
            <div style={{ fontSize: 11, color: '#888' }}>
              {r.email}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Chi nhánh & Dịch vụ',
      key: 'branchService',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 500, color: '#005030' }}>
            <BankOutlined style={{ marginRight: 6 }} />
            {r.branchName}
          </div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
            <Tag color="cyan">{r.serviceType}</Tag>
          </div>
        </div>
      )
    },
    {
      title: 'Thời gian hẹn',
      key: 'time',
      width: 180,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1f1f1f' }}>
            <CalendarOutlined style={{ marginRight: 6, color: '#1890ff' }} />
            {r.appointmentDate}
          </div>
          <div style={{ fontSize: 12, color: '#d46b08', marginTop: 2 }}>
            <ClockCircleOutlined style={{ marginRight: 6 }} />
            {r.timeSlot}
          </div>
        </div>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status) => {
        const cfg = STATUS_CONFIG[status] || { label: status, color: 'default' };
        return (
          <Tag color={cfg.color} icon={cfg.icon} style={{ padding: '3px 8px', borderRadius: 4, fontWeight: 500 }}>
            {cfg.label}
          </Tag>
        );
      }
    },
    {
      title: 'Người xử lý',
      key: 'handler',
      width: 160,
      render: (_, r) => (
        <div>
          {r.handledBy ? (
            <div>
              <Text strong style={{ fontSize: 12 }}>{r.handledBy}</Text>
              {r.handlerNote && (
                <Tooltip title={r.handlerNote}>
                  <div style={{ fontSize: 11, color: '#888', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 140 }}>
                    <CommentOutlined style={{ marginRight: 4 }} />
                    {r.handlerNote}
                  </div>
                </Tooltip>
              )}
            </div>
          ) : (
            <Text type="secondary" italic style={{ fontSize: 12 }}>Chưa tiếp nhận</Text>
          )}
        </div>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => openDetailModal(record)}
            />
          </Tooltip>
          <Tooltip title="Cập nhật trạng thái / Tiếp nhận">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              style={{ background: '#005030', borderColor: '#005030' }}
              onClick={() => openStatusModal(record)}
            >
              Xử lý
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      {/* Tiêu đề & Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={4} style={{ margin: 0, color: '#005030', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarOutlined /> Quản lý lịch hẹn của Chatbot & Cổng điện tử
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Theo dõi, tiếp đón và phục vụ khách hàng đã đặt lịch hẹn ưu tiên qua Chatbot AI Vietcombank
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="middle"
          style={{ background: '#005030', borderColor: '#005030', fontWeight: 600 }}
          onClick={() => setCreateModalOpen(true)}
        >
          Đặt lịch hẹn tại quầy
        </Button>
      </div>

      {/* Thẻ thống kê */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6} md={4} lg={4}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center', borderLeft: '4px solid #005030' }}>
            <div style={{ fontSize: 12, color: '#888' }}>Tổng số cuộc hẹn</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#005030' }}>{stats.TOTAL || 0}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={5} lg={5}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center', borderLeft: '4px solid #faad14' }}>
            <div style={{ fontSize: 12, color: '#888' }}>Chờ tiếp đón (PENDING)</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#faad14' }}>{stats.PENDING || 0}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={5} lg={5}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center', borderLeft: '4px solid #1890ff' }}>
            <div style={{ fontSize: 12, color: '#888' }}>Đã xác nhận (CONFIRMED)</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1890ff' }}>{stats.CONFIRMED || 0}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={5} lg={5}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center', borderLeft: '4px solid #52c41a' }}>
            <div style={{ fontSize: 12, color: '#888' }}>Đã hoàn tất (COMPLETED)</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#52c41a' }}>{stats.COMPLETED || 0}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={5} lg={5}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center', borderLeft: '4px solid #ff4d4f' }}>
            <div style={{ fontSize: 12, color: '#888' }}>Đã hủy (CANCELLED)</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#ff4d4f' }}>{stats.CANCELLED || 0}</div>
          </Card>
        </Col>
      </Row>

      {/* Thanh tìm kiếm & bộ lọc */}
      <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={10} md={10}>
            <Input
              placeholder="Tìm theo Mã hẹn, Tên KH, SĐT, Chi nhánh..."
              prefix={<SearchOutlined style={{ color: '#aaa' }} />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Lọc theo trạng thái"
              value={statusFilter || undefined}
              onChange={(val) => setStatusFilter(val || '')}
              allowClear
            >
              <Option value="">Tất cả trạng thái</Option>
              <Option value="PENDING">Chờ tiếp đón (PENDING)</Option>
              <Option value="CONFIRMED">Đã xác nhận (CONFIRMED)</Option>
              <Option value="COMPLETED">Đã hoàn tất (COMPLETED)</Option>
              <Option value="CANCELLED">Đã hủy (CANCELLED)</Option>
            </Select>
          </Col>
          <Col xs={12} sm={8} md={8}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} style={{ background: '#005030', borderColor: '#005030' }}>
                Tìm kiếm
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Bảng danh sách */}
      <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 8, overflow: 'hidden' }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          tableLayout="fixed"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Tổng cộng ${total} lịch hẹn`,
            pageSizeOptions: ['10', '20', '50']
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Modal Cập nhật trạng thái / Tiếp nhận xử lý */}
      <Modal
        title={
          <Space>
            <EditOutlined style={{ color: '#005030' }} />
            <span>Xử lý lịch hẹn #{selectedAppointment?.appointmentCode}</span>
          </Space>
        }
        open={statusModalOpen}
        onCancel={() => setStatusModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        {selectedAppointment && (
          <div>
            <Alert
              message={`Khách hàng: ${selectedAppointment.fullName} - SĐT: ${selectedAppointment.phoneNumber}`}
              description={`Hẹn ngày ${selectedAppointment.appointmentDate} (${selectedAppointment.timeSlot}) tại ${selectedAppointment.branchName}`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form form={statusForm} layout="vertical" onFinish={handleUpdateStatus}>
              <Form.Item
                name="status"
                label="Trạng thái xử lý"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái mới' }]}
              >
                <Select size="large">
                  <Option value="PENDING">
                    <Tag color="gold">Chờ tiếp đón (PENDING)</Tag> - Khách hàng chưa đến quầy
                  </Option>
                  <Option value="CONFIRMED">
                    <Tag color="processing">Đã xác nhận (CONFIRMED)</Tag> - Đã gọi điện/chuẩn bị hồ sơ
                  </Option>
                  <Option value="COMPLETED">
                    <Tag color="success">Đã hoàn tất (COMPLETED)</Tag> - Đã phục vụ xong tại quầy
                  </Option>
                  <Option value="CANCELLED">
                    <Tag color="error">Đã hủy (CANCELLED)</Tag> - Khách hàng báo hủy / không đến
                  </Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="handlerNote"
                label="Ghi chú của Giao dịch viên tiếp đón"
              >
                <TextArea
                  rows={3}
                  placeholder="Ví dụ: Đã gọi điện xác nhận lúc 08:30; Đã đón tiếp tại quầy số 02; Khách hàng đã mở sổ tiết kiệm..."
                />
              </Form.Item>

              <div style={{ textAlign: 'right', marginTop: 16 }}>
                <Space>
                  <Button onClick={() => setStatusModalOpen(false)}>Hủy bỏ</Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={updatingStatus}
                    style={{ background: '#005030', borderColor: '#005030' }}
                  >
                    Lưu cập nhật
                  </Button>
                </Space>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      {/* Modal Chi tiết lịch hẹn */}
      <Modal
        title={
          <Space>
            <CalendarOutlined style={{ color: '#005030' }} />
            <span>Chi tiết lịch hẹn: {detailData?.appointmentCode}</span>
          </Space>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            Đóng
          </Button>,
          <Button
            key="edit"
            type="primary"
            style={{ background: '#005030', borderColor: '#005030' }}
            onClick={() => {
              setDetailModalOpen(false);
              openStatusModal(detailData);
            }}
          >
            Tiếp nhận & Cập nhật
          </Button>
        ]}
        width={650}
      >
        {detailData && (
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Mã lịch hẹn" span={2}>
              <Text strong style={{ color: '#005030', fontFamily: 'monospace', fontSize: 15 }}>
                {detailData.appointmentCode}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Họ tên khách hàng">
              <Text strong>{detailData.fullName}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              <Text copyable>{detailData.phoneNumber}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {detailData.email || 'Chưa cung cấp'}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {(() => {
                const cfg = STATUS_CONFIG[detailData.status] || { label: detailData.status, color: 'default' };
                return <Tag color={cfg.color}>{cfg.label}</Tag>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="Chi nhánh phục vụ" span={2}>
              <BankOutlined style={{ marginRight: 6, color: '#005030' }} />
              {detailData.branchName}
            </Descriptions.Item>
            <Descriptions.Item label="Nhu cầu dịch vụ" span={2}>
              <Tag color="cyan">{detailData.serviceType}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày hẹn">
              <CalendarOutlined style={{ marginRight: 6, color: '#1890ff' }} />
              {detailData.appointmentDate}
            </Descriptions.Item>
            <Descriptions.Item label="Khung giờ">
              <ClockCircleOutlined style={{ marginRight: 6, color: '#d46b08' }} />
              {detailData.timeSlot}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú của khách hàng" span={2}>
              {detailData.note || 'Không có ghi chú'}
            </Descriptions.Item>
            <Descriptions.Item label="Cán bộ tiếp đón">
              {detailData.handledBy || 'Chưa có cán bộ tiếp nhận'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {detailData.createdAt ? dayjs(detailData.createdAt).format('DD/MM/YYYY HH:mm') : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú xử lý nội bộ" span={2}>
              {detailData.handlerNote || 'Chưa có ghi chú nội bộ'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Modal Tạo lịch hẹn tại quầy */}
      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: '#005030' }} />
            <span>Thêm lịch hẹn giao dịch tại quầy</span>
          </Space>
        }
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateAppointment}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="fullName"
                label="Họ và tên khách hàng"
                rules={[{ required: true, message: 'Nhập họ và tên' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Nguyễn Văn A" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phoneNumber"
                label="Số điện thoại"
                rules={[{ required: true, message: 'Nhập số điện thoại' }]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="09xxxxxxxx" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="email" label="Địa chỉ Email">
            <Input placeholder="email@example.com" />
          </Form.Item>

          <Form.Item
            name="branchName"
            label="Chi nhánh phục vụ"
            rules={[{ required: true, message: 'Chọn chi nhánh' }]}
            initialValue="Chi nhánh Hoàn Kiếm - Hà Nội"
          >
            <Select>
              <Option value="Chi nhánh Hoàn Kiếm - Hà Nội">VCB Hoàn Kiếm - 198 Trần Quang Khải, Hà Nội</Option>
              <Option value="Chi nhánh Ba Đình - Hà Nội">VCB Ba Đình - 521 Kim Mã, Ba Đình, Hà Nội</Option>
              <Option value="Chi nhánh Bến Thành - TP.HCM">VCB Bến Thành - 69 Bùi Thị Xuân, Q.1, TP.HCM</Option>
              <Option value="Chi nhánh TP.HCM - Q.1">VCB TP.HCM - Tòa nhà Vietcombank Tower, Q.1</Option>
              <Option value="Chi nhánh Đà Nẵng">VCB Đà Nẵng - 140-142 Lê Lợi, Hải Châu, Đà Nẵng</Option>
              <Option value="Chi nhánh Cần Thơ">VCB Cần Thơ - 3-5-7 Hòa Bình, Ninh Kiều, Cần Thơ</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="serviceType"
            label="Dịch vụ cần giao dịch"
            rules={[{ required: true, message: 'Chọn dịch vụ' }]}
            initialValue="Gửi tiền tiết kiệm & Mở tài khoản"
          >
            <Select>
              <Option value="Gửi tiền tiết kiệm & Mở tài khoản">Gửi tiền tiết kiệm & Mở tài khoản</Option>
              <Option value="Tư vấn hồ sơ vay vốn (Mua nhà/Mua xe/Kinh doanh)">Tư vấn hồ sơ vay vốn (Mua nhà/Mua xe/Kinh doanh)</Option>
              <Option value="Phát hành thẻ tín dụng quốc tế">Phát hành thẻ tín dụng quốc tế</Option>
              <Option value="Giao dịch nộp / rút tiền mặt số lượng lớn">Giao dịch nộp / rút tiền mặt số lượng lớn</Option>
              <Option value="Tra soát giao dịch & Hỗ trợ ngân hàng số">Tra soát giao dịch & Hỗ trợ ngân hàng số</Option>
              <Option value="Dịch vụ Doanh nghiệp & Tài trợ thương mại">Dịch vụ Doanh nghiệp & Tài trợ thương mại</Option>
            </Select>
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="appointmentDate"
                label="Ngày hẹn"
                rules={[{ required: true, message: 'Chọn ngày hẹn' }]}
                initialValue={dayjs().add(1, 'day')}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="timeSlot"
                label="Khung giờ hẹn"
                rules={[{ required: true, message: 'Chọn khung giờ' }]}
                initialValue="09:00 - 10:00"
              >
                <Select>
                  <Option value="08:30 - 09:30">08:30 - 09:30 (Sáng)</Option>
                  <Option value="09:30 - 10:30">09:30 - 10:30 (Sáng)</Option>
                  <Option value="10:30 - 11:30">10:30 - 11:30 (Sáng)</Option>
                  <Option value="13:30 - 14:30">13:30 - 14:30 (Chiều)</Option>
                  <Option value="14:30 - 15:30">14:30 - 15:30 (Chiều)</Option>
                  <Option value="15:30 - 16:30">15:30 - 16:30 (Chiều)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="note" label="Ghi chú yêu cầu của khách">
            <TextArea rows={2} placeholder="Nhu cầu cụ thể của khách..." />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setCreateModalOpen(false)}>Hủy bỏ</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={creating}
                style={{ background: '#005030', borderColor: '#005030' }}
              >
                Tạo lịch hẹn
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
