import { useState } from 'react';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Typography,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  DollarOutlined,
  FileDoneOutlined,
  InfoCircleOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import client, { unwrap } from '../../api/client';
import { useCustomerAuth } from '../../store/CustomerAuthContext';

const { Title, Text, Paragraph } = Typography;

export default function ConsumerLoanPage() {
  const { customer } = useCustomerAuth();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  // Tính ước tính tiền trả hàng tháng
  const [calcAmount, setCalcAmount] = useState(100000000);
  const [calcMonths, setCalcMonths] = useState(12);

  const interestRateYear = 9.5; // 9.5% / năm
  const monthlyPrincipal = Math.round(calcAmount / (calcMonths || 1));
  const firstMonthInterest = Math.round((calcAmount * (interestRateYear / 100)) / 12);
  const totalMonthlyPayEstimate = monthlyPrincipal + firstMonthInterest;

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const res = await unwrap(
        client.post('/customer/loans/consumer', {
          requestedAmount: values.requestedAmount,
          termMonths: values.termMonths,
          purpose: values.purpose,
          monthlyIncome: values.monthlyIncome,
          incomeProofDocUrl: values.incomeProofDocUrl || 'https://vcb-storage.vn/docs/salary_statement_2026.pdf',
        })
      );

      setSuccessResult(res);
      message.success('Gửi hồ sơ vay tiêu dùng tín chấp thành công!');
    } catch (err) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi nộp hồ sơ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0, color: '#00482B' }}>
          <DollarOutlined /> Đăng ký Vay tiêu dùng tín chấp
        </Title>
        <Text type="secondary">
          Giải pháp tài chính linh hoạt, không cần tài sản bảo đảm, phê duyệt nhanh chóng qua ngân hàng số
        </Text>
      </div>

      {successResult ? (
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            textAlign: 'center',
            padding: '24px 0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}
        >
          <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
          <Title level={3} style={{ color: '#00482B', marginBottom: 8 }}>
            Nộp hồ sơ vay thành công!
          </Title>
          <Paragraph style={{ maxWidth: 500, margin: '0 auto 20px', color: '#666' }}>
            Hồ sơ mã số <strong style={{ color: '#00482B' }}>{successResult.applicationCode}</strong> đã được tiếp nhận
            vào hệ thống thẩm định tự động của Vietcombank.
          </Paragraph>

          <Space size="middle">
            <Button
              type="primary"
              style={{ background: '#00482B', borderColor: '#00482B' }}
              onClick={() => (window.location.hash = '#/customer/my-applications')}
            >
              Xem tiến độ xử lý
            </Button>
            <Button onClick={() => setSuccessResult(null)}>Tạo khoản vay khác</Button>
          </Space>
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          {/* CỘT FORM NỘP HỒ SƠ */}
          <Col xs={24} lg={15}>
            <Card
              title={<span style={{ color: '#00482B' }}>Thông tin đề nghị vay vốn</span>}
              bordered={false}
              style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  requestedAmount: 100000000,
                  termMonths: 12,
                  monthlyIncome: 25000000,
                  purpose: 'Tiêu dùng cá nhân & mua sắm trang thiết bị',
                  incomeProofDocUrl: 'https://vcb-storage.vn/docs/salary_statement_2026.pdf',
                }}
                onFinish={handleSubmit}
                onValuesChange={(changed, all) => {
                  if (all.requestedAmount) setCalcAmount(Number(all.requestedAmount));
                  if (all.termMonths) setCalcMonths(Number(all.termMonths));
                }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="requestedAmount"
                      label="Số tiền muốn vay (VNĐ)"
                      rules={[{ required: true, message: 'Vui lòng nhập số tiền vay' }]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                        min={10000000}
                        max={500000000}
                        step={5000000}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="termMonths"
                      label="Thời hạn vay"
                      rules={[{ required: true, message: 'Vui lòng chọn thời hạn vay' }]}
                    >
                      <Select size="large">
                        <Select.Option value={6}>6 tháng</Select.Option>
                        <Select.Option value={12}>12 tháng (1 năm)</Select.Option>
                        <Select.Option value={24}>24 tháng (2 năm)</Select.Option>
                        <Select.Option value={36}>36 tháng (3 năm)</Select.Option>
                        <Select.Option value={48}>48 tháng (4 năm)</Select.Option>
                        <Select.Option value={60}>60 tháng (5 năm)</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="monthlyIncome"
                      label="Thu nhập chuyển khoản hàng tháng (VNĐ)"
                      rules={[{ required: true, message: 'Vui lòng nhập thu nhập' }]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                        min={5000000}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="purpose"
                      label="Mục đích sử dụng vốn"
                      rules={[{ required: true, message: 'Vui lòng nhập mục đích' }]}
                    >
                      <Input placeholder="VD: Mua sắm nội thất, du lịch, học tập..." size="large" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="incomeProofDocUrl"
                  label="Đường dẫn chứng từ thu nhập / Sao kê lương trực tuyến"
                  extra="Hệ thống demo tự động tích hợp link sao kê lương chứng thực"
                >
                  <Input placeholder="https://..." size="large" />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={submitting}
                  icon={<RocketOutlined />}
                  style={{
                    background: '#00482B',
                    borderColor: '#00482B',
                    height: 48,
                    fontWeight: 'bold',
                    fontSize: 16,
                    marginTop: 12,
                  }}
                >
                  Nộp hồ sơ xét duyệt ngay
                </Button>
              </Form>
            </Card>
          </Col>

          {/* CỘT BẢNG TÍNH LÃI SUẤT ƯỚC TÍNH */}
          <Col xs={24} lg={9}>
            <Card
              title={<span style={{ color: '#00482B' }}>Dự tính kế hoạch trả nợ</span>}
              bordered={false}
              style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', background: '#fafbfc' }}
            >
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Số tiền vay">
                  <Text strong>{Number(calcAmount).toLocaleString('vi-VN')} VNĐ</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Thời hạn vay">
                  <Text strong>{calcMonths} tháng</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Lãi suất tham chiếu">
                  <Text strong style={{ color: '#52c41a' }}>
                    {interestRateYear}% / năm (Cố định năm đầu)
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Gốc trả hàng tháng">
                  {Number(monthlyPrincipal).toLocaleString('vi-VN')} VNĐ
                </Descriptions.Item>
                <Descriptions.Item label="Lãi tháng đầu tiên">
                  {Number(firstMonthInterest).toLocaleString('vi-VN')} VNĐ
                </Descriptions.Item>
                <Descriptions.Item label="Ước tính tháng đầu">
                  <Text strong style={{ color: '#00482B', fontSize: 16 }}>
                    {Number(totalMonthlyPayEstimate).toLocaleString('vi-VN')} VNĐ
                  </Text>
                </Descriptions.Item>
              </Descriptions>

              <Divider style={{ margin: '14px 0' }} />

              <div style={{ background: '#e6f4ea', padding: 12, borderRadius: 8, fontSize: 12, color: '#00482B' }}>
                <InfoCircleOutlined style={{ marginRight: 6 }} />
                <strong>Đặc quyền khách hàng Vietcombank:</strong>
                <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                  <li>Tự động giải ngân vào tài khoản sau khi duyệt.</li>
                  <li>Không phạt trả nợ trước hạn sau 12 tháng.</li>
                  <li>Bảo hiểm khoản vay toàn diện.</li>
                </ul>
              </div>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
