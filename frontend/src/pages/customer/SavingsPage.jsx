import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  DollarOutlined,
  LockOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import client, { unwrap } from '../../api/client';
import { useCustomerAuth } from '../../store/CustomerAuthContext';

const { Title, Text, Paragraph } = Typography;

export default function SavingsPage() {
  const { customer, isEnterprise } = useCustomerAuth();
  const [savingsList, setSavingsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  // Bảng tính lãi
  const [depositAmount, setDepositAmount] = useState(50000000);
  const [termMonths, setTermMonths] = useState(12);

  const getRate = (months) => {
    if (months >= 12) return 6.8;
    if (months >= 6) return 5.5;
    if (months >= 3) return 4.5;
    return 3.5;
  };

  const currentRate = getRate(termMonths);
  const estimatedInterest = Math.round(depositAmount * (currentRate / 100) * (termMonths / 12));

  const loadSavings = async () => {
    setLoading(true);
    try {
      const data = await unwrap(client.get('/customer/savings'));
      setSavingsList(data || []);
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể tải danh sách sổ tiết kiệm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavings();
  }, []);

  const handleCreateSaving = async () => {
    try {
      const values = await form.validateFields();
      setCreating(true);
      await unwrap(
        client.post('/customer/savings', {
          productCode: values.productCode || 'ONLINE_SAVING_REGULAR',
          depositAmount: values.depositAmount,
          termMonths: values.termMonths,
        })
      );

      message.success('Mở sổ tiết kiệm Online thành công!');
      setCreateModalOpen(false);
      form.resetFields();
      loadSavings();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Không thể mở sổ tiết kiệm');
    } finally {
      setCreating(false);
    }
  };

  const totalDeposit = savingsList.reduce((acc, s) => acc + Number(s.depositAmount || 0), 0);
  const totalInterestExpected = savingsList.reduce((acc, s) => acc + Number(s.expectedInterest || 0), 0);

  const columns = [
    {
      title: 'Mã số sổ',
      dataIndex: 'savingCode',
      key: 'savingCode',
      render: (code) => <Text strong style={{ color: '#00482B' }}>{code}</Text>,
    },
    {
      title: 'Kỳ hạn',
      dataIndex: 'termMonths',
      key: 'termMonths',
      render: (m) => <Tag color="blue">{m} tháng</Tag>,
    },
    {
      title: 'Lãi suất (%/năm)',
      dataIndex: 'interestRate',
      key: 'interestRate',
      render: (r) => <Text strong style={{ color: '#52c41a' }}>{r}%</Text>,
    },
    {
      title: 'Số tiền gửi gốc',
      dataIndex: 'depositAmount',
      key: 'depositAmount',
      align: 'right',
      render: (val) => (
        <Text strong style={{ color: '#005030', fontSize: 14 }}>
          {Number(val).toLocaleString('vi-VN')} đ
        </Text>
      ),
    },
    {
      title: 'Tiền lãi dự kiến đến hạn',
      dataIndex: 'expectedInterest',
      key: 'expectedInterest',
      align: 'right',
      render: (val) => (
        <Text strong style={{ color: '#13c2c2' }}>
          +{Number(val).toLocaleString('vi-VN')} đ
        </Text>
      ),
    },
    {
      title: 'Ngày đáo hạn',
      dataIndex: 'maturityDate',
      key: 'maturityDate',
      render: (val) => (val ? new Date(val).toLocaleDateString('vi-VN') : '-'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag color={s === 'ACTIVE' ? 'success' : 'default'}>{s}</Tag>,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#00482B' }}>
            <SafetyCertificateOutlined /> Tiết Kiệm Online Vietcombank
          </Title>
          <Text type="secondary">
            Gửi tiền online sinh lời vượt trội, cộng thêm lãi suất tới +0.3%/năm so với gửi tại quầy
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadSavings} loading={loading}>
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ background: '#00482B', borderColor: '#00482B' }}
            onClick={() => setCreateModalOpen(true)}
          >
            Mở sổ tiết kiệm mới
          </Button>
        </Space>
      </div>

      {/* STATS OVERVIEW */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 10, borderLeft: '4px solid #00482B' }}>
            <Statistic
              title="Tổng số sổ đang hoạt động"
              value={savingsList.filter((s) => s.status === 'ACTIVE').length}
              suffix="sổ"
              prefix={<SafetyCertificateOutlined style={{ color: '#00482B' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 10, borderLeft: '4px solid #13c2c2' }}>
            <Statistic
              title="Tổng số tiền gốc gửi"
              value={totalDeposit}
              formatter={(v) => `${Number(v).toLocaleString('vi-VN')} đ`}
              prefix={<DollarOutlined style={{ color: '#13c2c2' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 10, borderLeft: '4px solid #52c41a' }}>
            <Statistic
              title="Tổng tiền lãi dự kiến nhận"
              value={totalInterestExpected}
              formatter={(v) => `${Number(v).toLocaleString('vi-VN')} đ`}
              valueStyle={{ color: '#52c41a' }}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* DANH SÁCH SỔ */}
      <Card
        title={<span style={{ color: '#00482B' }}>Danh sách Sổ tiết kiệm Online của bạn</span>}
        bordered={false}
        style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <Table
          columns={columns}
          dataSource={savingsList}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 6 }}
        />
      </Card>

      {/* MODAL MỞ SỔ TIẾT KIỆM */}
      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#00482B' }} />
            <span>Mở sổ tiết kiệm Online Vietcombank</span>
          </Space>
        }
        open={createModalOpen}
        onOk={handleCreateSaving}
        onCancel={() => setCreateModalOpen(false)}
        confirmLoading={creating}
        okText="Xác nhận mở sổ"
        cancelText="Hủy"
        width={580}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            productCode: 'ONLINE_SAVING_REGULAR',
            depositAmount: 50000000,
            termMonths: 12,
          }}
          onValuesChange={(changed, all) => {
            if (all.depositAmount) setDepositAmount(Number(all.depositAmount));
            if (all.termMonths) setTermMonths(Number(all.termMonths));
          }}
          style={{ marginTop: 16 }}
        >
          <Form.Item name="productCode" label="Sản phẩm tiết kiệm">
            <Select size="large">
              <Select.Option value="ONLINE_SAVING_REGULAR">Tiết kiệm Online trả lãi cuối kỳ</Select.Option>
              <Select.Option value="ONLINE_SAVING_MONTHLY">Tiết kiệm trả lãi định kỳ hàng tháng</Select.Option>
              <Select.Option value="ONLINE_SAVING_FLEXIBLE">Tiết kiệm rút gốc linh hoạt từng phần</Select.Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="depositAmount"
                label="Số tiền gửi (Tối thiểu 1,000,000 đ)"
                rules={[{ required: true, message: 'Nhập số tiền gửi' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  min={1000000}
                  step={5000000}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="termMonths"
                label="Kỳ hạn gửi"
                rules={[{ required: true, message: 'Chọn kỳ hạn' }]}
              >
                <Select size="large">
                  <Select.Option value={1}>1 tháng (3.5%/năm)</Select.Option>
                  <Select.Option value={3}>3 tháng (4.5%/năm)</Select.Option>
                  <Select.Option value={6}>6 tháng (5.5%/năm)</Select.Option>
                  <Select.Option value={12}>12 tháng (6.8%/năm)</Select.Option>
                  <Select.Option value={24}>24 tháng (6.8%/năm)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* DỰ TÍNH LÃI */}
          <Card size="small" style={{ background: '#f8fafc', marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Lãi suất áp dụng">
                <Text strong style={{ color: '#52c41a', fontSize: 15 }}>
                  {currentRate}% / năm
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tiền lãi tạm tính cuối kỳ">
                <Text strong style={{ color: '#00482B', fontSize: 16 }}>
                  +{Number(estimatedInterest).toLocaleString('vi-VN')} VNĐ
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tổng nhận khi đáo hạn">
                <Text strong>
                  {Number(depositAmount + estimatedInterest).toLocaleString('vi-VN')} VNĐ
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Form>
      </Modal>
    </div>
  );
}
