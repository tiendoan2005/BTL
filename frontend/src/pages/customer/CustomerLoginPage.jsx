import { useState } from 'react';
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  Segmented,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  BankOutlined,
  CheckCircleFilled,
  LockOutlined,
  SafetyCertificateFilled,
  ShopOutlined,
  ThunderboltFilled,
  UserAddOutlined,
  UserOutlined,
} from '@ant-design/icons';
import client, { unwrap } from '../../api/client';
import { useCustomerAuth } from '../../store/CustomerAuthContext';
import { useLanguage } from '../../store/LanguageContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const { Title, Text, Paragraph } = Typography;

export default function CustomerLoginPage() {
  const [loading, setLoading] = useState(false);
  const [customerType, setCustomerType] = useState('INDIVIDUAL');
  const { loginCustomer } = useCustomerAuth();
  const { t, lang } = useLanguage();
  const [form] = Form.useForm();

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const res = await unwrap(
        client.post('/customer/auth/login', {
          username: values.username,
          password: values.password,
        })
      );

      loginCustomer(res);
      message.success(
        lang === 'vi'
          ? `Chào mừng ${res.fullName} đến với Vietcombank Digital Portal!`
          : `Welcome ${res.fullName} to Vietcombank Digital Portal!`
      );
      window.location.hash = '#/portal';
    } catch (err) {
      message.error(
        err.response?.data?.message ||
          (lang === 'vi'
            ? 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!'
            : 'Login failed. Please verify your credentials!')
      );
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAccount = (username, pass, type) => {
    setCustomerType(type);
    form.setFieldsValue({
      username,
      password: pass,
    });
    message.success(lang === 'vi' ? `Đã điền tài khoản: ${username}` : `Filled: ${username}`);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #002B18 0%, #00482B 50%, #0B3D25 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Decorative Glow Orbs */}
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
          maxWidth: 960,
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: 20,
          boxShadow: '0 24px 64px rgba(0, 20, 10, 0.45)',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          zIndex: 1,
        }}
      >
        {/* LEFT COLUMN: BRANDING & HIGHLIGHTS */}
        <div
          style={{
            background: 'linear-gradient(145deg, #003820 0%, #00482B 65%, #005A36 100%)',
            padding: '40px 36px',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
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
                <Text strong style={{ color: '#fff', fontSize: 16, display: 'block', letterSpacing: 0.5, lineHeight: 1.2 }}>
                  VIETCOMBANK
                </Text>
                <Text style={{ color: '#A2DEB1', fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>
                  DIGITAL BANKING PORTAL
                </Text>
              </div>
            </div>

            <Title level={3} style={{ color: '#FFFFFF', fontWeight: 700, margin: '0 0 12px 0', lineHeight: 1.3 }}>
              {lang === 'vi' ? 'Hệ sinh thái Ngân hàng số Đột phá' : 'Next-Gen Digital Banking Experience'}
            </Title>
            <Paragraph style={{ color: '#D1E7DD', fontSize: 13.5, lineHeight: 1.6, marginBottom: 28 }}>
              {lang === 'vi'
                ? 'Giải pháp tài chính thông minh, bảo mật đa tầng, phục vụ tức thì mọi nhu cầu vay vốn, thẻ tín dụng, tiết kiệm và quản lý dòng tiền doanh nghiệp.'
                : 'Intelligent financial solutions with multi-layer security, instant credit financing, international cards, and automated cash management.'}
            </Paragraph>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <CheckCircleFilled style={{ color: '#73B828', fontSize: 18, marginTop: 2 }} />
                <div>
                  <Text strong style={{ color: '#FFFFFF', fontSize: 13, display: 'block' }}>
                    {lang === 'vi' ? 'Phê duyệt hồ sơ trực tuyến 24/7' : '24/7 Instant Online Approval'}
                  </Text>
                  <Text style={{ color: '#A2DEB1', fontSize: 12 }}>
                    {lang === 'vi' ? 'Tiếp cận nguồn vốn tiêu dùng & SXKD nhanh chóng' : 'Quick access to personal and business credit lines'}
                  </Text>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <SafetyCertificateFilled style={{ color: '#73B828', fontSize: 18, marginTop: 2 }} />
                <div>
                  <Text strong style={{ color: '#FFFFFF', fontSize: 13, display: 'block' }}>
                    {lang === 'vi' ? 'Bảo mật tiêu chuẩn Quốc tế' : 'Bank-Grade Global Security'}
                  </Text>
                  <Text style={{ color: '#A2DEB1', fontSize: 12 }}>
                    {lang === 'vi' ? 'Mã hóa dữ liệu cấp ngân hàng, xác thực đa yếu tố' : 'End-to-end encryption with advanced MFA'}
                  </Text>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <ThunderboltFilled style={{ color: '#73B828', fontSize: 18, marginTop: 2 }} />
                <div>
                  <Text strong style={{ color: '#FFFFFF', fontSize: 13, display: 'block' }}>
                    {lang === 'vi' ? 'Lãi suất tiết kiệm cạnh tranh' : 'High-Yield Savings & Smart Rates'}
                  </Text>
                  <Text style={{ color: '#A2DEB1', fontSize: 12 }}>
                    {lang === 'vi' ? 'Tối ưu lợi nhuận cho nguồn vốn nhàn rỗi' : 'Maximize returns on individual and enterprise deposits'}
                  </Text>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              paddingTop: 24,
              borderTop: '1px solid rgba(255,255,255,0.12)',
              marginTop: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BankOutlined style={{ color: '#73B828', fontSize: 16 }} />
              <Text style={{ color: '#A2DEB1', fontSize: 12 }}>Hotline 24/7: <strong>1900 54 54 13</strong></Text>
            </div>
            <Tag color="#73B828" style={{ color: '#00482B', fontWeight: 700, margin: 0, border: 'none' }}>
              PROD 2026
            </Tag>
          </div>
        </div>

        {/* RIGHT COLUMN: LOGIN FORM */}
        <div style={{ padding: '36px 36px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Top Bar: Language & Public Portal Link */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <a
                href="#/portal"
                style={{
                  color: '#637381',
                  fontSize: 12.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontWeight: 500,
                  transition: 'color 0.2s',
                }}
              >
                <ArrowLeftOutlined style={{ fontSize: 11 }} /> {lang === 'vi' ? 'Cổng thông tin' : 'Public Web'}
              </a>
              <LanguageSwitcher size="small" />
            </div>

            <div style={{ marginBottom: 20 }}>
              <Title level={3} style={{ margin: 0, color: '#00482B', fontWeight: 700, fontSize: 22 }}>
                {lang === 'vi' ? 'Đăng nhập Khách hàng' : 'Customer Sign In'}
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {lang === 'vi'
                  ? 'Vui lòng chọn loại tài khoản và nhập thông tin đăng nhập'
                  : 'Select your account type and enter your credentials'}
              </Text>
            </div>

            {/* Account Type Segmented Tab */}
            <div style={{ marginBottom: 20 }}>
              <Segmented
                block
                size="large"
                value={customerType}
                onChange={(val) => setCustomerType(val)}
                options={[
                  {
                    label: (
                      <div style={{ padding: '4px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 600 }}>
                        <UserOutlined />
                        <span>{t('customer.individual')}</span>
                      </div>
                    ),
                    value: 'INDIVIDUAL',
                  },
                  {
                    label: (
                      <div style={{ padding: '4px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 600 }}>
                        <ShopOutlined />
                        <span>{t('customer.enterprise')}</span>
                      </div>
                    ),
                    value: 'ENTERPRISE',
                  },
                ]}
                style={{
                  background: '#F1F5F9',
                  padding: 3,
                  borderRadius: 10,
                }}
              />
            </div>

            {/* Login Form */}
            <Form form={form} layout="vertical" onFinish={handleLogin} requiredMark={false}>
              <Form.Item
                name="username"
                label={
                  <span style={{ fontWeight: 600, fontSize: 13, color: '#1C252E' }}>
                    {customerType === 'INDIVIDUAL'
                      ? (lang === 'vi' ? 'Tên đăng nhập / Số CCCD' : 'Username / National ID')
                      : (lang === 'vi' ? 'Mã Doanh nghiệp / Tên đăng nhập' : 'Business Tax ID / Username')}
                  </span>
                }
                rules={[
                  {
                    required: true,
                    message:
                      lang === 'vi'
                        ? 'Vui lòng nhập tên đăng nhập / mã khách hàng'
                        : 'Please enter your username or ID',
                  },
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#00482B', marginRight: 4 }} />}
                  placeholder={
                    customerType === 'INDIVIDUAL'
                      ? (lang === 'vi' ? 'VD: kh_thuha hoặc 001198000123' : 'e.g. kh_thuha or ID number')
                      : (lang === 'vi' ? 'VD: dn_abctech hoặc 0101234567' : 'e.g. dn_abctech or Tax ID')
                  }
                  size="large"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: '#1C252E' }}>
                      {lang === 'vi' ? 'Mật khẩu bảo mật' : 'Password'}
                    </span>
                    <a
                      href="#/portal"
                      onClick={(e) => {
                        e.preventDefault();
                        message.info(
                          lang === 'vi'
                            ? 'Vui lòng liên hệ Hotline 1900545413 hoặc quầy giao dịch VCB để cấp lại mật khẩu.'
                            : 'Please contact Hotline 1900545413 or nearest VCB branch for password recovery.'
                        );
                      }}
                      style={{ fontSize: 12, color: '#005030', fontWeight: 500 }}
                    >
                      {lang === 'vi' ? 'Quên mật khẩu?' : 'Forgot password?'}
                    </a>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message:
                      lang === 'vi' ? 'Vui lòng nhập mật khẩu tài khoản' : 'Please enter your password',
                  },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#00482B', marginRight: 4 }} />}
                  placeholder={lang === 'vi' ? 'Nhập mật khẩu' : 'Enter password'}
                  size="large"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                style={{
                  background: 'linear-gradient(135deg, #00482B 0%, #005A36 100%)',
                  borderColor: '#00482B',
                  height: 46,
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: 0.3,
                  marginTop: 6,
                  boxShadow: '0 4px 12px rgba(0,72,43,0.25)',
                }}
              >
                {t('common.login')}
              </Button>
            </Form>

            {/* Registration Banner */}
            <div
              style={{
                marginTop: 18,
                padding: '10px 14px',
                background: '#EBF7E3',
                borderRadius: 8,
                border: '1px solid rgba(115,184,40,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserAddOutlined style={{ color: '#00482B', fontSize: 15 }} />
                <Text style={{ fontSize: 12.5, color: '#003820', fontWeight: 500 }}>
                  {lang === 'vi' ? 'Chưa có tài khoản e-Banking?' : 'Need a digital banking account?'}
                </Text>
              </div>
              <a
                href="#/customer/register"
                style={{
                  color: '#00482B',
                  fontWeight: 700,
                  fontSize: 12.5,
                  textDecoration: 'underline',
                  whiteSpace: 'nowrap',
                }}
              >
                {lang === 'vi' ? 'Đăng ký ngay' : 'Register now'}
              </a>
            </div>

            {/* Quick Demo Accounts */}
            <Divider orientation="center" style={{ fontSize: 11, color: '#919EAB', margin: '20px 0 10px' }}>
              {lang === 'vi' ? 'TÀI KHOẢN TRẢI NGHIỆM ĐIỀN NHANH (DEMO)' : 'CUSTOMER QUICK LOGIN ACCOUNTS'}
            </Divider>

            <div
              style={{
                background: '#F8FAFC',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px dashed #CBD5E1',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {/* Account 1: kh_thuha */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12 }}>
                  <Tag color="green" style={{ fontSize: 10, padding: '0 4px', margin: '0 6px 0 0' }}>CÁ NHÂN</Tag>
                  <code style={{ color: '#00482B', fontWeight: 600 }}>kh_thuha</code>
                </div>
                <Button
                  size="small"
                  type="link"
                  onClick={() => fillQuickAccount('kh_thuha', 'Customer@123', 'INDIVIDUAL')}
                  style={{ color: '#00482B', fontWeight: 600, fontSize: 12, padding: 0 }}
                >
                  {lang === 'vi' ? 'Điền nhanh →' : 'Quick Fill →'}
                </Button>
              </div>

              {/* Account 2: kh_namle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12 }}>
                  <Tag color="cyan" style={{ fontSize: 10, padding: '0 4px', margin: '0 6px 0 0' }}>VAY VỐN</Tag>
                  <code style={{ color: '#00482B', fontWeight: 600 }}>kh_namle</code>
                </div>
                <Button
                  size="small"
                  type="link"
                  onClick={() => fillQuickAccount('kh_namle', 'Customer@123', 'INDIVIDUAL')}
                  style={{ color: '#0891B2', fontWeight: 600, fontSize: 12, padding: 0 }}
                >
                  {lang === 'vi' ? 'Điền nhanh →' : 'Quick Fill →'}
                </Button>
              </div>

              {/* Account 3: dn_abctech */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12 }}>
                  <Tag color="geekblue" style={{ fontSize: 10, padding: '0 4px', margin: '0 6px 0 0' }}>DOANH NGHIỆP</Tag>
                  <code style={{ color: '#00482B', fontWeight: 600 }}>dn_abctech</code>
                </div>
                <Button
                  size="small"
                  type="link"
                  onClick={() => fillQuickAccount('dn_abctech', 'Customer@123', 'ENTERPRISE')}
                  style={{ color: '#2563EB', fontWeight: 600, fontSize: 12, padding: 0 }}
                >
                  {lang === 'vi' ? 'Điền nhanh →' : 'Quick Fill →'}
                </Button>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <a href="#/login" style={{ color: '#637381', fontSize: 12 }}>
              {lang === 'vi' ? '🔒 Cán bộ & Quản trị viên VCB? Đăng nhập tại đây' : '🔒 Internal Staff Login Portal'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
