import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Modal,
  Row,
  Space,
  Table,
  Tag,
  Timeline,
  Typography,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  FileDoneOutlined,
  FileSyncOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import client, { unwrap } from '../../api/client';
import { useCustomerAuth } from '../../store/CustomerAuthContext';

const { Title, Text, Paragraph } = Typography;

export default function MyApplicationsPage() {
  const { customer, isIndividual, isEnterprise } = useCustomerAuth();
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await unwrap(client.get('/customer/my-applications'));
      setApplications(data || []);
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể tải danh sách hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const getStatusTag = (status) => {
    switch (status) {
      case 'PENDING':
        return <Tag icon={<ClockCircleOutlined />} color="gold">Chờ thẩm định</Tag>;
      case 'DOCS_REQUIRED':
        return <Tag icon={<FileSyncOutlined />} color="orange">Yêu cầu bổ sung hồ sơ</Tag>;
      case 'APPROVED':
        return <Tag icon={<CheckCircleOutlined />} color="success">Đã phê duyệt</Tag>;
      case 'REJECTED':
        return <Tag icon={<CloseCircleOutlined />} color="error">Bị từ chối</Tag>;
      case 'CANCELLED':
        return <Tag color="default">Đã hủy</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const getTimelineItems = (app) => {
    const items = [
      {
        color: 'green',
        children: (
          <div>
            <Text strong>Nộp hồ sơ trực tuyến</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {app.createdAt ? new Date(app.createdAt).toLocaleString('vi-VN') : 'Đang xử lý'}
            </Text>
          </div>
        ),
      },
    ];

    if (app.status === 'PENDING') {
      items.push({
        color: 'blue',
        children: (
          <div>
            <Text strong>Chuyên viên tín dụng đang thẩm định & rà soát hồ sơ</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>Hệ thống tự động chấm điểm sơ bộ</Text>
          </div>
        ),
      });
      items.push({
        color: 'gray',
        children: <Text type="secondary">Phê duyệt hạn mức & Giải ngân</Text>,
      });
    } else if (app.status === 'DOCS_REQUIRED') {
      items.push({
        color: 'orange',
        children: (
          <div>
            <Text strong style={{ color: '#d46b08' }}>Cần bổ sung thêm chứng từ chứng minh thu nhập / tài sản</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>Vui lòng liên hệ hotline VCB 1900 54 54 13 để được hướng dẫn</Text>
          </div>
        ),
      });
    } else if (app.status === 'APPROVED') {
      items.push({
        color: 'green',
        children: (
          <div>
            <Text strong>Thẩm định hoàn tất - Đạt yêu cầu phê duyệt</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>Điểm tín dụng & TSBĐ thỏa mãn điều kiện</Text>
          </div>
        ),
      });
      items.push({
        color: 'green',
        children: (
          <div>
            <Text strong style={{ color: '#005030' }}>ĐÃ PHÊ DUYỆT & GIẢI NGÂN HẠN MỨC</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {app.updatedAt ? new Date(app.updatedAt).toLocaleString('vi-VN') : ''}
            </Text>
          </div>
        ),
      });
    } else if (app.status === 'REJECTED') {
      items.push({
        color: 'red',
        children: (
          <div>
            <Text strong style={{ color: '#cf1322' }}>Hồ sơ chưa đạt tiêu chí phê duyệt của ngân hàng</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {app.updatedAt ? new Date(app.updatedAt).toLocaleString('vi-VN') : ''}
            </Text>
          </div>
        ),
      });
    }

    return items;
  };

  const columns = [
    {
      title: 'Mã hồ sơ',
      dataIndex: 'applicationCode',
      key: 'applicationCode',
      render: (code) => <Text strong style={{ color: '#00482B' }}>{code}</Text>,
    },
    {
      title: 'Loại nghiệp vụ / Mục đích',
      dataIndex: 'purposeOrDetail',
      key: 'purposeOrDetail',
      render: (detail, record) => (
        <div>
          <Text strong>{detail || record.applicationType}</Text>
          <br />
          <Tag color="cyan" style={{ fontSize: 10 }}>{record.applicationType}</Tag>
        </div>
      ),
    },
    {
      title: 'Số tiền / Hạn mức đề xuất',
      dataIndex: 'requestedAmount',
      key: 'requestedAmount',
      align: 'right',
      render: (val) => (
        <Text strong style={{ color: '#005030', fontSize: 14 }}>
          {val ? `${Number(val).toLocaleString('vi-VN')} VNĐ` : '0 VNĐ'}
        </Text>
      ),
    },
    {
      title: 'Trạng thái xử lý',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Thời gian tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val) => (val ? new Date(val).toLocaleString('vi-VN') : '-'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          ghost
          icon={<EyeOutlined />}
          size="small"
          onClick={() => {
            setSelectedApp(record);
            setModalOpen(true);
          }}
        >
          Tiến độ
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#00482B' }}>
            <FileDoneOutlined /> Theo dõi tiến độ hồ sơ
          </Title>
          <Text type="secondary">
            Tra cứu trạng thái các bộ hồ sơ vay vốn, mở thẻ tín dụng đã nộp vào Vietcombank
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchApplications} loading={loading}>
            Làm mới
          </Button>
          {isIndividual && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ background: '#00482B', borderColor: '#00482B' }}
              onClick={() => (window.location.hash = '#/customer/loans/consumer')}
            >
              Nộp hồ sơ vay mới
            </Button>
          )}
          {isEnterprise && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ background: '#00482B', borderColor: '#00482B' }}
              onClick={() => (window.location.hash = '#/customer/loans/business')}
            >
              Nộp hồ sơ vay vốn DN
            </Button>
          )}
        </Space>
      </div>

      <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Table
          columns={columns}
          dataSource={applications}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: <Empty description="Bạn chưa nộp hồ sơ dịch vụ nào tại Vietcombank" /> }}
        />
      </Card>

      {/* MODAL TIẾN ĐỘ CHI TIẾT */}
      <Modal
        title={
          <Space>
            <FileSyncOutlined style={{ color: '#00482B' }} />
            <span>Tiến độ xử lý hồ sơ: {selectedApp?.applicationCode}</span>
          </Space>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={[
          <Button key="close" type="primary" style={{ background: '#00482B' }} onClick={() => setModalOpen(false)}>
            Đóng
          </Button>,
        ]}
        width={600}
      >
        {selectedApp && (
          <div style={{ marginTop: 16 }}>
            <Card size="small" style={{ background: '#f8fafc', marginBottom: 20 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary">Nghiệp vụ:</Text>
                  <div>
                    <Text strong>{selectedApp.purposeOrDetail}</Text>
                  </div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Số tiền đề xuất:</Text>
                  <div>
                    <Text strong style={{ color: '#005030', fontSize: 16 }}>
                      {selectedApp.requestedAmount
                        ? `${Number(selectedApp.requestedAmount).toLocaleString('vi-VN')} VNĐ`
                        : '0 VNĐ'}
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>

            <Title level={5} style={{ marginBottom: 16, color: '#00482B' }}>
              Quy trình phê duyệt tự động & chuyên viên
            </Title>

            <Timeline items={getTimelineItems(selectedApp)} />

            {selectedApp.documentUrls && selectedApp.documentUrls.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <Text strong>Chứng từ đính kèm:</Text>
                <ul style={{ paddingLeft: 20, marginTop: 6, fontSize: 12 }}>
                  {selectedApp.documentUrls.map((doc, idx) => (
                    <li key={idx}>
                      <a href={doc} target="_blank" rel="noreferrer" style={{ color: '#00482B' }}>
                        {doc}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
