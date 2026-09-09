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
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  CreditCardOutlined,
  GiftOutlined,
  SafetyCertificateOutlined,
  SmileOutlined,
  StarFilled,
} from '@ant-design/icons';
import client, { unwrap } from '../../api/client';

const { Title, Text, Paragraph } = Typography;

const CARDS_INFO = [
  {
    code: 'VIETCOMBANK VISA PLATINUM',
    title: 'Vietcombank Visa Platinum',
    color: 'linear-gradient(135deg, #1f1c2c 0%, #928DAB 100%)',
    limitMax: 1000000000,
    benefits: 'Hoàn tiền 0.5% mọi chi tiêu, Tặng lượt phòng chờ sân bay hạng thương gia, Bảo hiểm du lịch 11.65 tỷ VNĐ.',
  },
  {
    code: 'VIETCOMBANK MASTERCARD WORLD',
    title: 'Vietcombank Mastercard World',
    color: 'linear-gradient(135deg, #00482B 0%, #176B43 100%)',
    limitMax: 500000000,
    benefits: 'Tích điểm VCB Rewards x3 lần, Giảm 50% phí ra sân Golf tại 30+ sân Golf cao cấp tại VN.',
  },
  {
    code: 'VIETCOMBANK JCB ULTIMATE',
    title: 'Vietcombank JCB Ultimate',
    color: 'linear-gradient(135deg, #8A2387 0%, #E94057 50%, #F27121 100%)',
    limitMax: 300000000,
    benefits: 'Đặc quyền ẩm thực Nhật Bản cao cấp giảm tới 30%, Miễn phí thường niên năm đầu.',
  },
];

export default function CreditCardPage() {
  const [form] = Form.useForm();
  const [selectedCard, setSelectedCard] = useState(CARDS_INFO[0].code);
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const res = await unwrap(
        client.post('/customer/cards', {
          cardCategory: selectedCard,
          requestedLimit: values.requestedLimit,
          monthlyIncome: values.monthlyIncome,
          receiveAddress: values.receiveAddress,
          proofDocUrl: values.proofDocUrl || 'https://vcb-storage.vn/docs/financial_proof.pdf',
        })
      );

      setSuccessResult(res);
      message.success('Đăng ký phát hành thẻ tín dụng thành công!');
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể gửi hồ sơ mở thẻ');
    } finally {
      setSubmitting(false);
    }
  };

  const currentCardDetail = CARDS_INFO.find((c) => c.code === selectedCard) || CARDS_INFO[0];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0, color: '#00482B' }}>
          <CreditCardOutlined /> Phát Hành Thẻ Tín Dụng Quốc Tế Vietcombank
        </Title>
        <Text type="secondary">
          Chi tiêu trước, trả tiền sau — Miễn lãi lên tới 45 ngày cùng hàng ngàn ưu đãi du lịch & ẩm thực
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
            Hồ sơ mở thẻ đã được ghi nhận!
          </Title>
          <Paragraph style={{ maxWidth: 500, margin: '0 auto 20px', color: '#666' }}>
            Mã hồ sơ: <strong style={{ color: '#00482B' }}>{successResult.applicationCode}</strong>
            <br />
            Thẻ vật lý sẽ được sản xuất và chuyển phát bảo đảm tận tay khách hàng trong vòng 3 - 5 ngày làm việc.
          </Paragraph>

          <Space size="middle">
            <Button
              type="primary"
              style={{ background: '#00482B', borderColor: '#00482B' }}
              onClick={() => (window.location.hash = '#/customer/my-applications')}
            >
              Theo dõi phát hành thẻ
            </Button>
            <Button onClick={() => setSuccessResult(null)}>Đăng ký thêm thẻ khác</Button>
          </Space>
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={15}>
            <Card
              title={<span style={{ color: '#00482B' }}>Chọn loại thẻ & Hạn mức đề xuất</span>}
              bordered={false}
              style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              <div style={{ marginBottom: 20 }}>
                <Text strong style={{ display: 'block', marginBottom: 10 }}>
                  1. Chọn dòng thẻ tín dụng:
                </Text>
                <Row gutter={[12, 12]}>
                  {CARDS_INFO.map((c) => (
                    <Col xs={24} sm={8} key={c.code}>
                      <div
                        onClick={() => setSelectedCard(c.code)}
                        style={{
                          border: selectedCard === c.code ? '2px solid #00482B' : '1px solid #e2e8f0',
                          borderRadius: 8,
                          padding: 12,
                          cursor: 'pointer',
                          background: selectedCard === c.code ? '#e6f4ea' : '#fff',
                          height: '100%',
                        }}
                      >
                        <div
                          style={{
                            height: 60,
                            borderRadius: 6,
                            background: c.color,
                            color: '#fff',
                            padding: 8,
                            fontSize: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            marginBottom: 8,
                          }}
                        >
                          <span style={{ fontWeight: 'bold' }}>Vietcombank</span>
                          <span>{c.title}</span>
                        </div>
                        <Text strong style={{ fontSize: 13, color: '#00482B' }}>
                          {c.title}
                        </Text>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>

              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  requestedLimit: 50000000,
                  monthlyIncome: 20000000,
                  receiveAddress: '198 Trần Quang Khải, P. Lý Thái Tổ, Hoàn Kiếm, Hà Nội',
                  proofDocUrl: 'https://vcb-storage.vn/docs/financial_proof.pdf',
                }}
                onFinish={handleSubmit}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="requestedLimit"
                      label="Hạn mức tín dụng mong muốn (VNĐ)"
                      rules={[{ required: true, message: 'Nhập hạn mức mong muốn' }]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                        min={10000000}
                        max={currentCardDetail.limitMax}
                        step={5000000}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="monthlyIncome"
                      label="Thu nhập chuyển khoản (VNĐ)"
                      rules={[{ required: true, message: 'Nhập thu nhập hàng tháng' }]}
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

                <Form.Item
                  name="receiveAddress"
                  label="Địa chỉ nhận thẻ vật lý (Chuyển phát nhanh)"
                  rules={[{ required: true, message: 'Vui lòng nhập địa chỉ nhận thẻ' }]}
                >
                  <Input placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" size="large" />
                </Form.Item>

                <Form.Item
                  name="proofDocUrl"
                  label="Đường dẫn chứng minh tài chính online"
                  extra="Hệ thống demo tự động thẩm định bảng lương và hợp đồng lao động"
                >
                  <Input placeholder="https://..." size="large" />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={submitting}
                  icon={<CreditCardOutlined />}
                  style={{
                    background: '#00482B',
                    borderColor: '#00482B',
                    height: 48,
                    fontWeight: 'bold',
                    fontSize: 16,
                    marginTop: 8,
                  }}
                >
                  Xác nhận mở thẻ tín dụng
                </Button>
              </Form>
            </Card>
          </Col>

          <Col xs={24} lg={9}>
            <Card
              title={<span style={{ color: '#00482B' }}>Đặc quyền thẻ {currentCardDetail.title}</span>}
              bordered={false}
              style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              {/* Mô phỏng thẻ */}
              <div
                style={{
                  height: 160,
                  borderRadius: 12,
                  background: currentCardDetail.color,
                  color: '#fff',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                  boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong style={{ color: '#fff', fontSize: 16 }}>
                    Vietcombank
                  </Text>
                  <SafetyCertificateOutlined style={{ fontSize: 20, color: '#73B828' }} />
                </div>
                <div>
                  <Text style={{ color: '#d0ebd5', letterSpacing: 2, fontSize: 14 }}>
                    •••• •••• •••• 8868
                  </Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <Text style={{ color: '#999', fontSize: 9, display: 'block' }}>CARDHOLDER NAME</Text>
                    <Text strong style={{ color: '#fff', fontSize: 12 }}>
                      NGUYEN VAN A
                    </Text>
                  </div>
                  <Text strong style={{ color: '#fff', fontSize: 12 }}>
                    {currentCardDetail.title.includes('VISA') ? 'VISA' : 'Mastercard'}
                  </Text>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 13, lineHeight: 1.6 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                  <GiftOutlined style={{ color: '#00482B', fontSize: 16, marginTop: 3 }} />
                  <div>
                    <strong>Quyền lợi nổi bật:</strong>
                    <br />
                    {currentCardDetail.benefits}
                  </div>
                </div>

                <Divider style={{ margin: '8px 0' }} />

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <StarFilled style={{ color: '#faad14' }} />
                  <span>Miễn phí phát hành & Miễn phí thường niên năm đầu</span>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
