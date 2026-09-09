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
  BankOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  RocketOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import client, { unwrap } from '../../api/client';
import { useCustomerAuth } from '../../store/CustomerAuthContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function BusinessLoanPage() {
  const { customer } = useCustomerAuth();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  const [calcAmount, setCalcAmount] = useState(2000000000); // 2 tỷ
  const [calcMonths, setCalcMonths] = useState(36);

  const interestRateYear = 7.8; // 7.8%/năm
  const monthlyPrincipal = Math.round(calcAmount / (calcMonths || 1));
  const firstMonthInterest = Math.round((calcAmount * (interestRateYear / 100)) / 12);
  const monthlyEstimate = monthlyPrincipal + firstMonthInterest;

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const res = await unwrap(
        client.post('/customer/loans/business', {
          requestedAmount: values.requestedAmount,
          termMonths: values.termMonths,
          businessPlanSummary: values.businessPlanSummary,
          annualRevenue: values.annualRevenue,
          financialReportDocUrl: values.financialReportDocUrl || 'https://vcb-storage.vn/docs/financial_statements_2025_audited.pdf',
        })
      );

      setSuccessResult(res);
      message.success('Nộp hồ sơ vay vốn sản xuất kinh doanh thành công!');
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể gửi hồ sơ vay');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0, color: '#00482B' }}>
          <SolutionOutlined /> Gói Vay Sản Xuất Kinh Doanh Doanh Nghiệp (SME & Corporate)
        </Title>
        <Text type="secondary">
          Tài trợ vốn lưu động, đầu tư mở rộng nhà xưởng máy móc với hạn mức không giới hạn và lãi suất ưu đãi chỉ từ 7.8%/năm
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
            Hồ sơ vay vốn doanh nghiệp đã được gửi đến VCB!
          </Title>
          <Paragraph style={{ maxWidth: 520, margin: '0 auto 20px', color: '#666' }}>
            Mã hồ sơ tiếp nhận: <strong style={{ color: '#00482B' }}>{successResult.applicationCode}</strong>
            <br />
            Khối Khách hàng Doanh nghiệp Vietcombank sẽ phân công Chuyên viên Quản lý Quan hệ Khách hàng (RM) liên hệ hỗ trợ thẩm định trong 24 giờ.
          </Paragraph>

          <Space size="middle">
            <Button
              type="primary"
              style={{ background: '#00482B', borderColor: '#00482B' }}
              onClick={() => (window.location.hash = '#/customer/my-applications')}
            >
              Theo dõi tiến độ hồ sơ
            </Button>
            <Button onClick={() => setSuccessResult(null)}>Nộp hồ sơ khác</Button>
          </Space>
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={15}>
            <Card
              title={<span style={{ color: '#00482B' }}>Phương án kinh doanh & Nhu cầu vốn</span>}
              bordered={false}
              style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  requestedAmount: 2000000000,
                  termMonths: 36,
                  annualRevenue: 15000000000,
                  businessPlanSummary: 'Mở rộng dây chuyền sản xuất và nhập khẩu nguyên vật liệu phục vụ đơn hàng Q3-Q4',
                  financialReportDocUrl: 'https://vcb-storage.vn/docs/financial_statements_2025_audited.pdf',
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
                      label="Hạn mức đề nghị vay (VNĐ)"
                      rules={[{ required: true, message: 'Nhập số tiền vay' }]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                        min={100000000}
                        step={100000000}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="termMonths"
                      label="Thời hạn cấp hạn mức"
                      rules={[{ required: true, message: 'Chọn thời hạn vay' }]}
                    >
                      <Select size="large">
                        <Select.Option value={12}>12 tháng (Hạn mức vốn lưu động ngắn hạn)</Select.Option>
                        <Select.Option value={24}>24 tháng (Trung hạn)</Select.Option>
                        <Select.Option value={36}>36 tháng (3 năm)</Select.Option>
                        <Select.Option value={60}>60 tháng (5 năm - Dự án đầu tư)</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="annualRevenue"
                  label="Doanh thu bình quân năm gần nhất (VNĐ)"
                  rules={[{ required: true, message: 'Nhập doanh thu năm' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="businessPlanSummary"
                  label="Tóm tắt phương án sử dụng vốn & Hiệu quả kinh doanh"
                  rules={[{ required: true, message: 'Nhập tóm tắt phương án' }]}
                >
                  <TextArea rows={3} placeholder="Mô tả mục đích sử dụng vốn, nguồn tiền trả nợ, đối tác mua bán..." />
                </Form.Item>

                <Form.Item
                  name="financialReportDocUrl"
                  label="Đường dẫn Báo cáo tài chính & Tờ khai thuế đã kiểm toán"
                  extra="Tự động liên kết hồ sơ BCTC và hóa đơn điện tử cho ngân hàng số Vietcombank"
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
                    marginTop: 8,
                  }}
                >
                  Nộp hồ sơ vay vốn doanh nghiệp
                </Button>
              </Form>
            </Card>
          </Col>

          {/* DỰ TOÁN TRẢ NỢ DOANH NGHIỆP */}
          <Col xs={24} lg={9}>
            <Card
              title={<span style={{ color: '#00482B' }}>Dự toán chi phí tài chính</span>}
              bordered={false}
              style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', background: '#fafbfc' }}
            >
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Hạn mức cấp">
                  <Text strong style={{ color: '#00482B' }}>
                    {Number(calcAmount).toLocaleString('vi-VN')} VNĐ
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Thời hạn vay">{calcMonths} tháng</Descriptions.Item>
                <Descriptions.Item label="Lãi suất gói ưu đãi">
                  <Text strong style={{ color: '#52c41a' }}>
                    {interestRateYear}% / năm
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Gốc định kỳ hàng tháng">
                  {Number(monthlyPrincipal).toLocaleString('vi-VN')} VNĐ
                </Descriptions.Item>
                <Descriptions.Item label="Lãi dự tính tháng đầu">
                  {Number(firstMonthInterest).toLocaleString('vi-VN')} VNĐ
                </Descriptions.Item>
                <Descriptions.Item label="Tổng chi trả tháng đầu">
                  <Text strong style={{ color: '#00482B', fontSize: 16 }}>
                    {Number(monthlyEstimate).toLocaleString('vi-VN')} VNĐ
                  </Text>
                </Descriptions.Item>
              </Descriptions>

              <Divider style={{ margin: '14px 0' }} />

              <div style={{ background: '#e6f7ff', padding: 12, borderRadius: 8, fontSize: 12, color: '#0050b3' }}>
                <InfoCircleOutlined style={{ marginRight: 6 }} />
                <strong>Ưu điểm gói vay SME Vietcombank:</strong>
                <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                  <li>Chấp nhận đa dạng TSBĐ: BĐS, Máy móc thiết bị, Quyền đòi nợ, Hàng tồn kho.</li>
                  <li>Tích hợp tài trợ thương mại & L/C ký quỹ linh hoạt từ 0 - 10%.</li>
                  <li>Miễn phí chuyển tiền trong nước & ưu đãi tỷ giá ngoại tệ.</li>
                </ul>
              </div>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
