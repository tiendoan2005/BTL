import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  FileTextOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import client, { unwrap } from '../../api/client';
import { useCustomerAuth } from '../../store/CustomerAuthContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function TradeFinancePage() {
  const { customer } = useCustomerAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await unwrap(client.get('/customer/trade-finance'));
      setRequests(data || []);
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể tải danh sách tài trợ thương mại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await unwrap(
        client.post('/customer/trade-finance', {
          serviceType: values.serviceType,
          amount: values.amount,
          currency: values.currency || 'USD',
          beneficiaryName: values.beneficiaryName,
          purpose: values.purpose,
          documentUrl: values.documentUrl || 'https://vcb-storage.vn/docs/commercial_contract_2026.pdf',
        })
      );

      message.success('Gửi yêu cầu Tài trợ thương mại / L/C thành công!');
      setModalOpen(false);
      form.resetFields();
      loadRequests();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const getServiceTypeLabel = (type) => {
    switch (type) {
      case 'LETTER_OF_CREDIT':
        return <Tag color="blue">Thư tín dụng (L/C)</Tag>;
      case 'BANK_GUARANTEE':
        return <Tag color="purple">Bảo lãnh ngân hàng</Tag>;
      case 'IMPORT_FINANCE':
        return <Tag color="cyan">Tài trợ nhập khẩu</Tag>;
      case 'EXPORT_FINANCE':
        return <Tag color="green">Tài trợ xuất khẩu</Tag>;
      default:
        return <Tag>{type}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Mã yêu cầu',
      dataIndex: 'requestCode',
      key: 'requestCode',
      render: (code) => <Text strong style={{ color: '#00482B' }}>{code}</Text>,
    },
    {
      title: 'Loại hình dịch vụ',
      dataIndex: 'serviceType',
      key: 'serviceType',
      render: (type) => getServiceTypeLabel(type),
    },
    {
      title: 'Số tiền & Ngoại tệ',
      key: 'amount',
      align: 'right',
      render: (_, r) => (
        <Text strong style={{ color: '#005030', fontSize: 14 }}>
          {Number(r.amount).toLocaleString('vi-VN')} {r.currency}
        </Text>
      ),
    },
    {
      title: 'Bên thụ hưởng (Đối tác)',
      dataIndex: 'beneficiaryName',
      key: 'beneficiaryName',
      render: (b) => <Text strong>{b}</Text>,
    },
    {
      title: 'Mục đích phát hành',
      dataIndex: 'purpose',
      key: 'purpose',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s) => (
        <Tag color={s === 'APPROVED' ? 'success' : s === 'PENDING' ? 'gold' : 'orange'}>{s}</Tag>
      ),
    },
    {
      title: 'Ngày nộp',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val) => (val ? new Date(val).toLocaleDateString('vi-VN') : '-'),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#00482B' }}>
            <SwapOutlined /> Tài Trợ Thương Mại & Bảo Lãnh Ngân Hàng
          </Title>
          <Text type="secondary">
            Phát hành Thư tín dụng (L/C), Bảo lãnh dự thầu/thực hiện hợp đồng và thanh toán quốc tế qua SWIFT
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadRequests} loading={loading}>
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ background: '#00482B', borderColor: '#00482B' }}
            onClick={() => setModalOpen(true)}
          >
            Yêu cầu phát hành mới
          </Button>
        </Space>
      </div>

      <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Table
          columns={columns}
          dataSource={requests}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* MODAL TẠO YÊU CẦU L/C */}
      <Modal
        title={
          <Space>
            <SwapOutlined style={{ color: '#00482B' }} />
            <span>Yêu cầu Phát hành L/C & Bảo lãnh Ngân hàng</span>
          </Space>
        }
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        okText="Gửi yêu cầu phát hành"
        cancelText="Hủy"
        width={620}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            serviceType: 'LETTER_OF_CREDIT',
            currency: 'USD',
            amount: 150000,
            beneficiaryName: 'TOYOTA TSUSHO CORPORATION JAPAN',
            purpose: 'Phát hành L/C nhập khẩu linh kiện ô tô thanh toán theo Incoterms 2020 CIF Hải Phòng',
            documentUrl: 'https://vcb-storage.vn/docs/commercial_contract_2026.pdf',
          }}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="serviceType"
                label="Loại hình dịch vụ"
                rules={[{ required: true, message: 'Chọn loại hình' }]}
              >
                <Select size="large">
                  <Select.Option value="LETTER_OF_CREDIT">Thư tín dụng (L/C) nhập khẩu</Select.Option>
                  <Select.Option value="BANK_GUARANTEE">Bảo lãnh ngân hàng (Dự thầu/Bảo hành)</Select.Option>
                  <Select.Option value="IMPORT_FINANCE">Tài trợ vốn thanh toán hàng nhập khẩu</Select.Option>
                  <Select.Option value="EXPORT_FINANCE">Chiết khấu bộ chứng từ xuất khẩu</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="currency" label="Loại đồng tiền">
                <Select size="large">
                  <Select.Option value="USD">USD - Đô la Mỹ</Select.Option>
                  <Select.Option value="EUR">EUR - Đồng Euro</Select.Option>
                  <Select.Option value="JPY">JPY - Yên Nhật</Select.Option>
                  <Select.Option value="VND">VND - Việt Nam Đồng</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="amount"
            label="Số tiền phát hành bảo lãnh / Trị giá L/C"
            rules={[{ required: true, message: 'Nhập số tiền' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="beneficiaryName"
            label="Bên thụ hưởng (Đối tác mua/bán quốc tế hoặc trong nước)"
            rules={[{ required: true, message: 'Nhập tên đơn vị thụ hưởng' }]}
          >
            <Input placeholder="Tên công ty đối tác" size="large" />
          </Form.Item>

          <Form.Item
            name="purpose"
            label="Chi tiết mục đích / Hợp đồng thương mại"
            rules={[{ required: true, message: 'Nhập chi tiết hợp đồng' }]}
          >
            <TextArea rows={3} placeholder="Mô tả hàng hóa, số hợp đồng thương mại, điều khoản Incoterms..." />
          </Form.Item>

          <Form.Item
            name="documentUrl"
            label="Đường dẫn Hợp đồng ngoại thương / Proforma Invoice"
          >
            <Input placeholder="https://..." size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
