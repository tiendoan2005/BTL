import { useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Segmented,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  BankOutlined,
  CheckCircleFilled,
  IdcardOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateFilled,
  ShopOutlined,
  ThunderboltFilled,
  UserOutlined,
} from '@ant-design/icons';
import client, { unwrap } from '../../api/client';
import { useCustomerAuth } from '../../store/CustomerAuthContext';
import { useLanguage } from '../../store/LanguageContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function CustomerRegisterPage() {
  const [loading, setLoading] = useState(false);
  const [customerType, setCustomerType] = useState('INDIVIDUAL');
  const { loginCustomer } = useCustomerAuth();
  const { t, lang } = useLanguage();
  const [form] = Form.useForm();

  const isVi = lang === 'vi';

  const handleRegister = async (values) => {
    setLoading(true);
    try {
      const payload = {
        username: values.username,
        password: values.password,
        fullName: values.fullName,
        customerType: customerType,
        idCardNumber: values.idCardNumber,
        phoneNumber: values.phoneNumber,
        email: values.email,

        // Cá nhân
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null,
        gender: values.gender || null,
        monthlyIncome: values.monthlyIncome || null,
        companyName: values.companyName || null,
        position: values.position || null,

        // Doanh nghiệp
        taxCode: values.taxCode || values.idCardNumber,
        enterpriseCompanyName: values.enterpriseCompanyName || values.fullName,
        representativeName: values.representativeName || values.fullName,
        businessLicenseNumber: values.businessLicenseNumber || values.idCardNumber,
        charterCapital: values.charterCapital || null,
      };

      const res = await unwrap(client.post('/customer/auth/register', payload));

      message.success(
        isVi
          ? `Chúc mừng ${res.fullName}! Bạn đã đăng ký tài khoản Vietcombank thành công.`
          : `Congratulations ${res.fullName}! You have successfully registered your Vietcombank account.`
      );

      loginCustomer(res);
      window.location.hash = '#/customer/dashboard';
    } catch (err) {
      message.error(
        err.response?.data?.message ||
          (isVi ? 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin!' : 'Registration failed. Please check your information!')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #002B18 0%, #00482B 50%, #0B3D25 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          right: '-10%',
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(115,184,40,0.18) 0%, rgba(0,72,43,0) 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,72,43,0.4) 0%, rgba(0,40,20,0) 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          maxWidth: 900,
          width: '100%',
          background: '#ffffff',
          borderRadius: 20,
          boxShadow: '0 24px 64px rgba(0, 20, 10, 0.45)',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          zIndex: 1,
        }}
      >
        {/* TOP BRAND HEADER */}
        <div
          style={{
            background: 'linear-gradient(145deg, #003820 0%, #00482B 65%, #005A36 100%)',
            padding: '28px 36px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            borderBottom: '3px solid #73B828',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                background: '#73B828',
                borderRadius: 10,
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00482B',
                fontWeight: 900,
                fontSize: 20,
                boxShadow: '0 4px 12px rgba(115,184,40,0.35)',
              }}
            >
              VCB
            </div>
            <div>
              <Text strong style={{ color: '#fff', fontSize: 17, display: 'block', letterSpacing: 0.5, lineHeight: 1.2 }}>
                VIETCOMBANK DIGITAL BANKING
              </Text>
              <Text style={{ color: '#A2DEB1', fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>
                {t('customer.registerTitle')}
              </Text>
            </div>
          </div>

          <Space size="middle">
            <a
              href="#/portal"
              style={{
                color: '#A2DEB1',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontWeight: 500,
              }}
            >
              <ArrowLeftOutlined style={{ fontSize: 11 }} /> {isVi ? 'Cổng thông tin' : 'Public Web'}
            </a>
            <LanguageSwitcher size="small" />
          </Space>
        </div>

        <div style={{ padding: '32px 36px 28px' }}>
          {/* Segmented Account Type */}
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13.5 }}>
              {t('customer.registerSubtitle')}
            </Text>
            <Segmented
              size="large"
              value={customerType}
              onChange={(val) => setCustomerType(val)}
              options={[
                {
                  label: (
                    <div style={{ padding: '4px 24px', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                      <UserOutlined />
                      <span>{t('customer.individual')}</span>
                    </div>
                  ),
                  value: 'INDIVIDUAL',
                },
                {
                  label: (
                    <div style={{ padding: '4px 24px', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                      <ShopOutlined />
                      <span>{t('customer.enterprise')}</span>
                    </div>
                  ),
                  value: 'ENTERPRISE',
                },
              ]}
              style={{
                background: '#F1F5F9',
                padding: 4,
                borderRadius: 10,
              }}
            />
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleRegister}
            requiredMark={false}
            initialValues={{ gender: 'Nam' }}
          >
            {/* THÔNG TIN TÀI KHOẢN */}
            <Divider orientation="left" style={{ color: '#00482B', fontSize: 13.5, borderColor: '#E2E8F0', fontWeight: 700 }}>
              <Space>
                <UserOutlined style={{ color: '#00482B' }} />
                <span>{t('customer.accountInfo')}</span>
              </Space>
            </Divider>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="username"
                  label={<span style={{ fontWeight: 600, fontSize: 13 }}>{isVi ? 'Tên đăng nhập (Username)' : 'Username'}</span>}
                  rules={[
                    { required: true, message: isVi ? 'Vui lòng nhập tên đăng nhập' : 'Please enter username' },
                    { min: 4, message: isVi ? 'Tên đăng nhập tối thiểu 4 ký tự' : 'Minimum 4 characters' },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined style={{ color: '#00482B', marginRight: 4 }} />}
                    placeholder={isVi ? 'VD: kh_nguyenvan' : 'e.g. kh_john'}
                    size="large"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="email"
                  label={<span style={{ fontWeight: 600, fontSize: 13 }}>Email</span>}
                  rules={[
                    { type: 'email', message: isVi ? 'Email không hợp lệ' : 'Invalid email' },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined style={{ color: '#00482B', marginRight: 4 }} />}
                    placeholder="VD: user@vietcombank.com.vn"
                    size="large"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="password"
                  label={<span style={{ fontWeight: 600, fontSize: 13 }}>{isVi ? 'Mật khẩu' : 'Password'}</span>}
                  rules={[
                    { required: true, message: isVi ? 'Vui lòng nhập mật khẩu' : 'Please enter password' },
                    { min: 6, message: isVi ? 'Mật khẩu tối thiểu 6 ký tự' : 'Minimum 6 characters' },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#00482B', marginRight: 4 }} />}
                    placeholder={isVi ? 'Tối thiểu 6 ký tự' : 'Min 6 characters'}
                    size="large"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="confirmPassword"
                  label={<span style={{ fontWeight: 600, fontSize: 13 }}>{isVi ? 'Xác nhận mật khẩu' : 'Confirm Password'}</span>}
                  dependencies={['password']}
                  rules={[
                    { required: true, message: isVi ? 'Vui lòng xác nhận mật khẩu' : 'Please confirm password' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error(isVi ? 'Mật khẩu xác nhận không khớp!' : 'Passwords do not match!')
                        );
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#00482B', marginRight: 4 }} />}
                    placeholder={isVi ? 'Nhập lại mật khẩu' : 'Re-enter password'}
                    size="large"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* THÔNG TIN ĐỊNH DANH */}
            <Divider orientation="left" style={{ color: '#00482B', fontSize: 13.5, borderColor: '#E2E8F0', fontWeight: 700, marginTop: 12 }}>
              {customerType === 'INDIVIDUAL' ? (
                <Space>
                  <IdcardOutlined style={{ color: '#00482B' }} />
                  <span>{t('customer.personalInfo')}</span>
                </Space>
              ) : (
                <Space>
                  <BankOutlined style={{ color: '#00482B' }} />
                  <span>{t('customer.enterpriseInfo')}</span>
                </Space>
              )}
            </Divider>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="fullName"
                  label={
                    <span style={{ fontWeight: 600, fontSize: 13 }}>
                      {customerType === 'INDIVIDUAL'
                        ? (isVi ? 'Họ và tên đầy đủ' : 'Full Name')
                        : (isVi ? 'Tên Doanh nghiệp / Tổ chức' : 'Company Name')}
                    </span>
                  }
                  rules={[
                    {
                      required: true,
                      message: isVi ? 'Vui lòng nhập họ tên / tên DN' : 'Please enter name',
                    },
                  ]}
                >
                  <Input
                    placeholder={
                      customerType === 'INDIVIDUAL'
                        ? (isVi ? 'VD: Nguyễn Văn An' : 'e.g. John Doe')
                        : (isVi ? 'VD: Công ty TNHH Giải Pháp Tech ABC' : 'e.g. ABC Tech Solutions Ltd')
                    }
                    size="large"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="phoneNumber"
                  label={<span style={{ fontWeight: 600, fontSize: 13 }}>{isVi ? 'Số điện thoại liên hệ' : 'Phone Number'}</span>}
                  rules={[
                    { required: true, message: isVi ? 'Vui lòng nhập số điện thoại' : 'Please enter phone' },
                  ]}
                >
                  <Input
                    prefix={<PhoneOutlined style={{ color: '#00482B', marginRight: 4 }} />}
                    placeholder="VD: 0988123456"
                    size="large"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="idCardNumber"
                  label={
                    <span style={{ fontWeight: 600, fontSize: 13 }}>
                      {customerType === 'INDIVIDUAL'
                        ? (isVi ? 'Số CMND / Căn cước công dân (12 số)' : 'National ID Card')
                        : (isVi ? 'Mã số thuế / Giấy phép ĐKKD' : 'Tax Code / Business License')}
                    </span>
                  }
                  rules={[
                    {
                      required: true,
                      message: isVi ? 'Vui lòng nhập số định danh' : 'Please enter ID number',
                    },
                  ]}
                >
                  <Input
                    prefix={<IdcardOutlined style={{ color: '#00482B', marginRight: 4 }} />}
                    placeholder={customerType === 'INDIVIDUAL' ? 'VD: 001298004567' : 'VD: 0109887766'}
                    size="large"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>

              {customerType === 'INDIVIDUAL' ? (
                <Col xs={24} sm={12}>
                  <Form.Item name="dateOfBirth" label={<span style={{ fontWeight: 600, fontSize: 13 }}>{isVi ? 'Ngày sinh' : 'Date of Birth'}</span>}>
                    <DatePicker style={{ width: '100%', borderRadius: 8 }} size="large" format="YYYY-MM-DD" placeholder={isVi ? 'Chọn ngày sinh' : 'Select birth date'} />
                  </Form.Item>
                </Col>
              ) : (
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="representativeName"
                    label={<span style={{ fontWeight: 600, fontSize: 13 }}>{isVi ? 'Người đại diện pháp luật' : 'Legal Representative'}</span>}
                  >
                    <Input placeholder={isVi ? 'VD: Trần Đình Long' : 'e.g. David Smith'} size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
              )}
            </Row>

            {/* BỔ SUNG CÁ NHÂN */}
            {customerType === 'INDIVIDUAL' && (
              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Form.Item name="gender" label={<span style={{ fontWeight: 600, fontSize: 13 }}>{isVi ? 'Giới tính' : 'Gender'}</span>}>
                    <Select size="large" style={{ borderRadius: 8 }}>
                      <Option value="Nam">{isVi ? 'Nam' : 'Male'}</Option>
                      <Option value="Nữ">{isVi ? 'Nữ' : 'Female'}</Option>
                      <Option value="Khác">{isVi ? 'Khác' : 'Other'}</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="monthlyIncome"
                    label={<span style={{ fontWeight: 600, fontSize: 13 }}>{isVi ? 'Thu nhập hàng tháng (VNĐ)' : 'Monthly Income (VND)'}</span>}
                  >
                    <InputNumber
                      style={{ width: '100%', borderRadius: 8 }}
                      size="large"
                      min={0}
                      step={1000000}
                      formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(v) => v.replace(/\$\s?|(,*)/g, '')}
                      placeholder="VD: 25,000,000"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="position" label={<span style={{ fontWeight: 600, fontSize: 13 }}>{isVi ? 'Chức vụ / Nghề nghiệp' : 'Position'}</span>}>
                    <Input placeholder={isVi ? 'VD: Kỹ sư phần mềm' : 'e.g. Software Engineer'} size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
              </Row>
            )}

            {/* BỔ SUNG DOANH NGHIỆP */}
            {customerType === 'ENTERPRISE' && (
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="charterCapital"
                    label={<span style={{ fontWeight: 600, fontSize: 13 }}>{isVi ? 'Vốn điều lệ đăng ký (VNĐ)' : 'Charter Capital (VND)'}</span>}
                  >
                    <InputNumber
                      style={{ width: '100%', borderRadius: 8 }}
                      size="large"
                      min={0}
                      step={50000000}
                      formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(v) => v.replace(/\$\s?|(,*)/g, '')}
                      placeholder="VD: 5,000,000,000"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="businessLicenseNumber"
                    label={<span style={{ fontWeight: 600, fontSize: 13 }}>{isVi ? 'Số Giấy phép kinh doanh' : 'Business License No.'}</span>}
                  >
                    <Input placeholder="VD: GPKD-HN-2024-9988" size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
              </Row>
            )}

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              style={{
                background: 'linear-gradient(135deg, #00482B 0%, #005A36 100%)',
                borderColor: '#00482B',
                height: 48,
                fontWeight: 700,
                marginTop: 14,
                fontSize: 15,
                boxShadow: '0 4px 14px rgba(0,72,43,0.25)',
              }}
            >
              {t('customer.btnRegister')}
            </Button>
          </Form>

          <Divider style={{ margin: '22px 0 16px' }} />

          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <a href="#/customer/login" style={{ color: '#00482B', fontWeight: 600, fontSize: 13.5 }}>
              {t('customer.alreadyHaveAccount')}
            </a>
            <a href="#/portal" style={{ color: '#637381', fontSize: 12.5 }}>
              ← {isVi ? 'Quay lại Cổng thông tin Vietcombank' : 'Back to Vietcombank Portal'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
