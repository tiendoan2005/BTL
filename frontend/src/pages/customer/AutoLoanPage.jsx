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
  Radio,
  Row,
  Select,
  Space,
  Typography,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  FileDoneOutlined,
  InfoCircleOutlined,
  RocketOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import client, { unwrap } from '../../api/client';

const { Title, Text, Paragraph } = Typography;

export default function AutoLoanPage() {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  const [carPrice, setCarPrice] = useState(800000000);
  const [loanAmount, setLoanAmount] = useState(600000000);
  const [termMonths, setTermMonths] = useState(60);

  const interestRateYear = 8.5; // 8.5%/năm
  const monthlyPrincipal = Math.round(loanAmount / (termMonths || 1));
  const firstMonthInterest = Math.round((loanAmount * (interestRateYear / 100)) / 12);
  const monthlyEstimate = monthlyPrincipal + firstMonthInterest;

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const res = await unwrap(
        client.post('/customer/loans/auto', {
          carBrand: values.carBrand,
          carModel: values.carModel,
          manufactureYear: values.manufactureYear,
          carPrice: values.carPrice,
          isNewCar: values.isNewCar,
          requestedAmount: values.requestedAmount,
          termMonths: values.termMonths,
          carQuoteDocUrl: values.carQuoteDocUrl || 'https://vcb-storage.vn/docs/car_contract_quote.pdf',
        })
      );

      setSuccessResult(res);
      message.success('Nộp hồ sơ vay mua ô tô thành công!');
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
          <ThunderboltOutlined /> Gói Vay Mua Ô Tô Trả Góp Vietcombank
        </Title>
        <Text type="secondary">
          Hỗ trợ tới 80% giá trị định giá xe, thời gian vay tối đa lên tới 8 năm (96 tháng)
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
            Hồ sơ vay mua ô tô đã được gửi thành công!
          </Title>
          <Paragraph style={{ maxWidth: 500, margin: '0 auto 20px', color: '#666' }}>
            Mã hồ sơ: <strong style={{ color: '#00482B' }}>{successResult.applicationCode}</strong>
            <br />
            Chuyên viên tín dụng ô tô VCB sẽ liên hệ trực tiếp với đại lý bán xe để thực hiện thủ tục giải ngân phong tỏa.
          </Paragraph>

          <Space size="middle">
            <Button
              type="primary"
              style={{ background: '#00482B', borderColor: '#00482B' }}
              onClick={() => (window.location.hash = '#/customer/my-applications')}
            >
              Theo dõi hồ sơ
            </Button>
            <Button onClick={() => setSuccessResult(null)}>Tạo hồ sơ khác</Button>
          </Space>
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={15}>
            <Card
              title={<span style={{ color: '#00482B' }}>Thông tin xe & Nhu cầu vay vốn</span>}
              bordered={false}
              style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  carBrand: 'Toyota',
                  carModel: 'Corolla Cross 1.8V',
                  manufactureYear: 2026,
                  carPrice: 800000000,
                  isNewCar: true,
                  requestedAmount: 600000000,
                  termMonths: 60,
                  carQuoteDocUrl: 'https://vcb-storage.vn/docs/car_contract_quote.pdf',
                }}
                onFinish={handleSubmit}
                onValuesChange={(changed, all) => {
                  if (all.carPrice) setCarPrice(Number(all.carPrice));
                  if (all.requestedAmount) setLoanAmount(Number(all.requestedAmount));
                  if (all.termMonths) setTermMonths(Number(all.termMonths));
                }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="carBrand"
                      label="Hãng xe"
                      rules={[{ required: true, message: 'Nhập hãng xe' }]}
                    >
                      <Select size="large">
                        <Select.Option value="Toyota">Toyota</Select.Option>
                        <Select.Option value="Honda">Honda</Select.Option>
                        <Select.Option value="Mazda">Mazda</Select.Option>
                        <Select.Option value="Hyundai">Hyundai</Select.Option>
                        <Select.Option value="Kia">Kia</Select.Option>
                        <Select.Option value="VinFast">VinFast</Select.Option>
                        <Select.Option value="Mercedes-Benz">Mercedes-Benz</Select.Option>
                        <Select.Option value="BMW">BMW</Select.Option>
                        <Select.Option value="Ford">Ford</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="carModel"
                      label="Dòng xe (Model)"
                      rules={[{ required: true, message: 'Nhập dòng xe' }]}
                    >
                      <Input placeholder="VD: Camry, CX-5, VF8..." size="large" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name="manufactureYear"
                      label="Năm sản xuất"
                      rules={[{ required: true, message: 'Nhập năm sản xuất' }]}
                    >
                      <InputNumber min={2018} max={2026} style={{ width: '100%' }} size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="isNewCar" label="Tình trạng xe">
                      <Radio.Group size="large">
                        <Radio.Button value={true}>Xe mới 100%</Radio.Button>
                        <Radio.Button value={false}>Xe đã qua SD</Radio.Button>
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="carPrice"
                      label="Giá trị xe (VNĐ)"
                      rules={[{ required: true, message: 'Nhập giá xe' }]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="requestedAmount"
                      label="Số tiền đề nghị vay (Tối đa 80% giá trị xe)"
                      rules={[{ required: true, message: 'Nhập số tiền vay' }]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="termMonths"
                      label="Thời gian vay"
                      rules={[{ required: true, message: 'Chọn thời hạn vay' }]}
                    >
                      <Select size="large">
                        <Select.Option value={12}>12 tháng (1 năm)</Select.Option>
                        <Select.Option value={24}>24 tháng (2 năm)</Select.Option>
                        <Select.Option value={36}>36 tháng (3 năm)</Select.Option>
                        <Select.Option value={48}>48 tháng (4 năm)</Select.Option>
                        <Select.Option value={60}>60 tháng (5 năm)</Select.Option>
                        <Select.Option value={84}>84 tháng (7 năm)</Select.Option>
                        <Select.Option value={96}>96 tháng (8 năm)</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="carQuoteDocUrl"
                  label="Hợp đồng mua bán / Báo giá từ Showroom xe"
                  extra="Tài sản bảo đảm của khoản vay sẽ được thế chấp bằng chính chiếc ô tô mua mới"
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
                  Gửi hồ sơ vay mua ô tô
                </Button>
              </Form>
            </Card>
          </Col>

          {/* CỘT TÍNH TOÁN LÃI SUẤT */}
          <Col xs={24} lg={9}>
            <Card
              title={<span style={{ color: '#00482B' }}>Dự toán trả góp xe hàng tháng</span>}
              bordered={false}
              style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', background: '#fafbfc' }}
            >
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Giá trị xe">
                  <Text strong>{Number(carPrice).toLocaleString('vi-VN')} VNĐ</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Số tiền vay ngân hàng">
                  <Text strong style={{ color: '#00482B' }}>
                    {Number(loanAmount).toLocaleString('vi-VN')} VNĐ ({Math.round((loanAmount / (carPrice || 1)) * 100)}%)
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Vốn tự có đối ứng">
                  <Text strong>{Number(Math.max(0, carPrice - loanAmount)).toLocaleString('vi-VN')} VNĐ</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Thời hạn vay">{termMonths} tháng</Descriptions.Item>
                <Descriptions.Item label="Lãi suất cố định">
                  <Text strong style={{ color: '#52c41a' }}>
                    {interestRateYear}% / năm
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Gốc trả hàng tháng">
                  {Number(monthlyPrincipal).toLocaleString('vi-VN')} VNĐ
                </Descriptions.Item>
                <Descriptions.Item label="Lãi tháng đầu tiên">
                  {Number(firstMonthInterest).toLocaleString('vi-VN')} VNĐ
                </Descriptions.Item>
                <Descriptions.Item label="Tổng trả tháng đầu">
                  <Text strong style={{ color: '#00482B', fontSize: 16 }}>
                    {Number(monthlyEstimate).toLocaleString('vi-VN')} VNĐ
                  </Text>
                </Descriptions.Item>
              </Descriptions>

              <Divider style={{ margin: '14px 0' }} />

              <div style={{ background: '#e6f4ea', padding: 12, borderRadius: 8, fontSize: 12, color: '#00482B' }}>
                <InfoCircleOutlined style={{ marginRight: 6 }} />
                <strong>Thủ tục vay mua xe Vietcombank:</strong>
                <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                  <li>Liên kết với 100% đại lý chính hãng toàn quốc.</li>
                  <li>Phát hành cam kết cho vay trong 4 giờ làm việc.</li>
                  <li>Thủ tục đăng ký sang tên bấm biển được ngân hàng hỗ trợ.</li>
                </ul>
              </div>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
