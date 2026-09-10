import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  BankOutlined,
  CheckCircleFilled,
  KeyOutlined,
  LockOutlined,
  SafetyCertificateFilled,
  SafetyCertificateOutlined,
  SafetyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import client, { unwrap } from '../api/client';
import { useAuth } from '../store/AuthContext';
import { useLanguage } from '../store/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const { Title, Text, Paragraph } = Typography;

/**
 * Đăng nhập Cán bộ / Quản trị viên 2 bước chuẩn Ngân hàng:
 *  Bước 1: username/password -> temp token + dev OTP
 *  Bước 2: nhập OTP 6 số -> JWT + Roles/Permissions
 */
export default function LoginPage() {
  const { login } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [step1, setStep1] = useState(null); // { username, tempToken, devOtp, maskedEmail }
  const [form] = Form.useForm();
  const [otpForm] = Form.useForm();

  const onPasswordSubmit = async ({ username, password }) => {
    setLoading(true);
    try {
      const data = await unwrap(client.post('/auth/login', { username, password }));
      setStep1(data);
      setStep(2);
      // Đảm bảo ô nhập OTP để trống để người dùng tự nhập tay
      otpForm.resetFields();
      if (data.devOtp) {
        message.info(
          lang === 'vi'
            ? `[MÔI TRƯỜNG DEV] Mã OTP bảo mật của bạn: ${data.devOtp}. Vui lòng nhập mã OTP để xác thực!`
            : `[DEV ENVIRONMENT] Your Security OTP: ${data.devOtp}. Please enter your OTP code!`
        );
      }
    } catch (err) {
      message.error(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const onOtpSubmit = async ({ otpCode }) => {
    setLoading(true);
    try {
      const data = await unwrap(
        client.post('/auth/verify-otp', {
          username: step1.username,
          tempToken: step1.tempToken,
          otpCode,
        })
      );
      login(data);
      message.success(
        lang === 'vi'
          ? `Đăng nhập thành công! Xin chào Cán bộ ${data.user.fullName}`
          : `Login successful! Welcome ${data.user.fullName}`
      );
      navigate('/', { replace: true });
    } catch (err) {
      message.error(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    try {
      const data = await unwrap(
        client.post('/auth/resend-otp', {
          username: step1.username,
          tempToken: step1.tempToken,
        })
      );
      setStep1((prev) => ({ ...prev, ...data }));
      otpForm.resetFields();
      if (data.devOtp) {
        message.info(
          lang === 'vi'
            ? `[MÔI TRƯỜNG DEV] Mã OTP mới: ${data.devOtp}. Vui lòng nhập vào ô bên dưới!`
            : `[DEV ENVIRONMENT] New OTP: ${data.devOtp}. Please enter below!`
        );
      }
    } catch (err) {
      message.error(extractError(err));
    }
  };

  const fillQuickAccount = (username, pass) => {
    form.setFieldsValue({
      username,
      password: pass,
    });
    message.success(
      lang === 'vi'
        ? `Đã điền tài khoản: ${username}. Hãy bấm "Tiếp tục xác thực OTP" để nhận mã OTP!`
        : `Filled: ${username}. Click "Continue" to receive your OTP!`
    );
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
      {/* Background Glow Orbs */}
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
        {/* LEFT COLUMN: INTERNAL PORTAL BANNER */}
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
                  ADMIN & STAFF OPERATION
                </Text>
              </div>
            </div>

            <Title level={3} style={{ color: '#FFFFFF', fontWeight: 700, margin: '0 0 12px 0', lineHeight: 1.3 }}>
              {lang === 'vi' ? 'Cổng Điều hành & Quản trị Nội bộ' : 'Internal Operation & Governance Portal'}
            </Title>
            <Paragraph style={{ color: '#D1E7DD', fontSize: 13.5, lineHeight: 1.6, marginBottom: 28 }}>
              {lang === 'vi'
                ? 'Hệ thống phục vụ nghiệp vụ cán bộ giao dịch, chuyên viên tín dụng, quản lý thẩm định và quản trị viên bảo mật ngân hàng Vietcombank.'
                : 'Centralized banking workspace for financial transactions, loan approvals, dispute resolutions, rate governance, and audit trails.'}
            </Paragraph>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <SafetyOutlined style={{ color: '#73B828', fontSize: 18, marginTop: 2 }} />
                <div>
                  <Text strong style={{ color: '#FFFFFF', fontSize: 13, display: 'block' }}>
                    {lang === 'vi' ? 'Xác thực 2 yếu tố 2FA bắt buộc' : 'Mandatory 2FA Multi-Factor Auth'}
                  </Text>
                  <Text style={{ color: '#A2DEB1', fontSize: 12 }}>
                    {lang === 'vi' ? 'Mã OTP bảo mật đảm bảo kiểm soát truy cập phân hệ' : 'One-time password for authorized personnel'}
                  </Text>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <CheckCircleFilled style={{ color: '#73B828', fontSize: 18, marginTop: 2 }} />
                <div>
                  <Text strong style={{ color: '#FFFFFF', fontSize: 13, display: 'block' }}>
                    {lang === 'vi' ? 'Quy trình thẩm định đa cấp độ' : 'Multi-Tier Credit Approval Workflow'}
                  </Text>
                  <Text style={{ color: '#A2DEB1', fontSize: 12 }}>
                    {lang === 'vi' ? 'Phê duyệt hồ sơ vay vốn, giải ngân & mở thẻ tín dụng' : 'Seamless loan appraisal and disbursement tracking'}
                  </Text>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <SafetyCertificateFilled style={{ color: '#73B828', fontSize: 18, marginTop: 2 }} />
                <div>
                  <Text strong style={{ color: '#FFFFFF', fontSize: 13, display: 'block' }}>
                    {lang === 'vi' ? 'Kiểm toán hệ thống (Audit Trail)' : 'Full Audit Trail Compliance'}
                  </Text>
                  <Text style={{ color: '#A2DEB1', fontSize: 12 }}>
                    {lang === 'vi' ? 'Ghi vết 100% nhật ký thao tác và thay đổi dữ liệu tỷ giá' : 'Complete logging of operational transactions & rates'}
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
              <Text style={{ color: '#A2DEB1', fontSize: 12 }}>IT Banking Security: <strong>PCI-DSS Compliant</strong></Text>
            </div>
            <Tag color="#73B828" style={{ color: '#00482B', fontWeight: 700, margin: 0, border: 'none' }}>
              INTERNAL
            </Tag>
          </div>
        </div>

        {/* RIGHT COLUMN: LOGIN FORM (2-STEP) */}
        <div style={{ padding: '36px 36px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Top Bar */}
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

            <div style={{ marginBottom: 24 }}>
              <Title level={3} style={{ margin: 0, color: '#00482B', fontWeight: 700, fontSize: 22 }}>
                {step === 1
                  ? (lang === 'vi' ? 'Đăng nhập Cán bộ VCB' : 'Staff Portal Login')
                  : (lang === 'vi' ? 'Xác thực OTP 2FA' : 'Verify Two-Factor OTP')}
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {step === 1
                  ? (lang === 'vi' ? 'Nhập tài khoản nhân sự được cấp trong hệ thống' : 'Enter your designated staff banking credentials')
                  : (lang === 'vi' ? 'Mã xác thực bảo mật gồm 6 chữ số' : 'Enter 6-digit one-time passcode')}
              </Text>
            </div>

            {step === 1 ? (
              <>
                <Form form={form} layout="vertical" onFinish={onPasswordSubmit} requiredMark={false}>
                  <Form.Item
                    name="username"
                    label={
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#1C252E' }}>
                        {lang === 'vi' ? 'Tên đăng nhập cán bộ' : 'Staff Username'}
                      </span>
                    }
                    rules={[{ required: true, message: lang === 'vi' ? 'Vui lòng nhập tên đăng nhập' : 'Please enter username' }]}
                  >
                    <Input
                      prefix={<UserOutlined style={{ color: '#00482B', marginRight: 4 }} />}
                      placeholder="VD: admin_super hoặc nv_hoangnam"
                      size="large"
                      style={{ borderRadius: 8 }}
                      autoFocus
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label={
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: '#1C252E' }}>
                          {lang === 'vi' ? 'Mật khẩu' : 'Password'}
                        </span>
                        <span style={{ fontSize: 12, color: '#637381' }}>
                          {lang === 'vi' ? 'Bảo mật 256-bit' : '256-bit SSL'}
                        </span>
                      </div>
                    }
                    rules={[{ required: true, message: lang === 'vi' ? 'Vui lòng nhập mật khẩu' : 'Please enter password' }]}
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ color: '#00482B', marginRight: 4 }} />}
                      placeholder={lang === 'vi' ? 'Nhập mật khẩu cán bộ' : 'Enter staff password'}
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
                    {lang === 'vi' ? 'Tiếp tục xác thực OTP →' : 'Continue to OTP Verification →'}
                  </Button>
                </Form>

                {/* Quick Demo Accounts */}
                <Divider orientation="center" style={{ fontSize: 11, color: '#919EAB', margin: '20px 0 10px' }}>
                  {lang === 'vi' ? 'TÀI KHOẢN CÁN BỘ ĐIỀN NHANH (DEMO)' : 'STAFF QUICK LOGIN ACCOUNTS'}
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
                  {/* Account 1: admin_super */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12 }}>
                      <Tag color="red" style={{ fontSize: 10, padding: '0 4px', margin: '0 6px 0 0' }}>ADMIN</Tag>
                      <code style={{ color: '#00482B', fontWeight: 600 }}>admin_super</code>
                    </div>
                    <Button
                      size="small"
                      type="link"
                      onClick={() => fillQuickAccount('admin_super', 'Admin@123')}
                      style={{ color: '#00482B', fontWeight: 600, fontSize: 12, padding: 0 }}
                    >
                      {lang === 'vi' ? 'Điền nhanh →' : 'Quick Fill →'}
                    </Button>
                  </div>

                  {/* Account 2: ql_minhtuan (QUẢN LÝ PHÊ DUYỆT) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12 }}>
                      <Tag color="purple" style={{ fontSize: 10, padding: '0 4px', margin: '0 6px 0 0' }}>PHÊ DUYỆT</Tag>
                      <code style={{ color: '#00482B', fontWeight: 600 }}>ql_minhtuan</code>
                    </div>
                    <Button
                      size="small"
                      type="link"
                      onClick={() => fillQuickAccount('ql_minhtuan', 'Manager@123')}
                      style={{ color: '#5B21B6', fontWeight: 600, fontSize: 12, padding: 0 }}
                    >
                      {lang === 'vi' ? 'Điền nhanh →' : 'Quick Fill →'}
                    </Button>
                  </div>

                  {/* Account 3: nv_hoangnam (GIAO DỊCH VIÊN / QUẢN LÝ LỊCH HẸN) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12 }}>
                      <Tag color="blue" style={{ fontSize: 10, padding: '0 4px', margin: '0 6px 0 0' }}>GIAO DỊCH</Tag>
                      <code style={{ color: '#00482B', fontWeight: 600 }}>nv_hoangnam</code>
                    </div>
                    <Button
                      size="small"
                      type="link"
                      onClick={() => fillQuickAccount('nv_hoangnam', 'Staff@123')}
                      style={{ color: '#0284C7', fontWeight: 600, fontSize: 12, padding: 0 }}
                    >
                      {lang === 'vi' ? 'Điền nhanh →' : 'Quick Fill →'}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <div
                  style={{
                    background: '#EBF7E3',
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1px solid rgba(115,184,40,0.4)',
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ fontSize: 13, color: '#003820', display: 'block' }}>
                    <SafetyCertificateOutlined style={{ color: '#00482B', marginRight: 6 }} />
                    {lang === 'vi'
                      ? `Mã OTP đã được gửi đến ${step1.maskedEmail || step1.maskedPhone || 'email cán bộ'}`
                      : `OTP sent to ${step1.maskedEmail || step1.maskedPhone || 'registered email'}`}
                  </Text>
                  {step1.devOtp && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: '10px 14px',
                        background: '#FEF3C7',
                        borderRadius: 8,
                        border: '1px solid #FCD34D',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text strong style={{ fontSize: 13, color: '#92400E' }}>
                          {lang === 'vi' ? 'Mã OTP của bạn:' : 'Your OTP code:'}
                        </Text>
                        <Tag color="gold" style={{ fontSize: 16, fontWeight: 700, padding: '2px 8px', letterSpacing: 3, margin: 0 }}>
                          {step1.devOtp}
                        </Tag>
                      </div>
                      <Text type="secondary" style={{ fontSize: 11.5, display: 'block', marginTop: 4 }}>
                        {lang === 'vi'
                          ? 'Vui lòng tự nhập 6 số trên vào ô bên dưới để xác thực bảo mật.'
                          : 'Please enter the 6 digits above into the input below.'}
                      </Text>
                    </div>
                  )}
                </div>

                <Form form={otpForm} layout="vertical" onFinish={onOtpSubmit}>
                  <Form.Item
                    name="otpCode"
                    rules={[
                      { required: true, message: lang === 'vi' ? 'Vui lòng nhập mã OTP' : 'Enter OTP' },
                      { len: 6, message: lang === 'vi' ? 'Mã OTP gồm 6 chữ số' : '6 digits required' },
                    ]}
                  >
                    <Input
                      size="large"
                      maxLength={6}
                      inputMode="numeric"
                      placeholder="• • • • • •"
                      style={{
                        textAlign: 'center',
                        letterSpacing: 14,
                        fontSize: 24,
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        height: 52,
                        borderRadius: 8,
                      }}
                      autoFocus
                    />
                  </Form.Item>

                  <Space direction="vertical" style={{ width: '100%' }} size={10}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      size="large"
                      loading={loading}
                      style={{
                        background: 'linear-gradient(135deg, #00482B 0%, #005A36 100%)',
                        borderColor: '#00482B',
                        height: 46,
                        fontWeight: 700,
                      }}
                    >
                      {lang === 'vi' ? 'Xác nhận & Vào hệ thống' : 'Verify & Enter Dashboard'}
                    </Button>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Button type="link" onClick={onResend} style={{ padding: 0, color: '#005030', fontWeight: 600 }}>
                        {lang === 'vi' ? 'Gửi lại mã OTP' : 'Resend OTP'}
                      </Button>
                      <Button type="text" onClick={() => setStep(1)} style={{ padding: 0, color: '#637381' }}>
                        {lang === 'vi' ? '← Quay lại nhập mật khẩu' : '← Back'}
                      </Button>
                    </div>
                  </Space>
                </Form>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <a href="#/customer/login" style={{ color: '#00482B', fontWeight: 600, fontSize: 12.5 }}>
              {lang === 'vi' ? '→ Bạn là Khách hàng? Đăng nhập Cổng Khách Hàng tại đây' : '→ Are you a Customer? Sign in here'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function extractError(err) {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.message === 'Network Error') return 'Không kết nối được máy chủ (backend chưa chạy?)';
  return err.message || 'Có lỗi xảy ra';
}
