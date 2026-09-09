import { Button, Result } from 'antd';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import { CustomerAuthProvider, useCustomerAuth } from './store/CustomerAuthContext';
import { LanguageProvider } from './store/LanguageContext';
import MainLayout from './components/MainLayout';
import CustomerLayout from './components/CustomerLayout';

// Admin / Staff Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ExchangeRatesPage from './pages/data/ExchangeRatesPage';
import GoldRatesPage from './pages/data/GoldRatesPage';
import InterestRatesPage from './pages/data/InterestRatesPage';
import FeeTemplatesPage from './pages/data/FeeTemplatesPage';
import ApplicationsPage from './pages/approvals/ApplicationsPage';
import ApplicationDetailPage from './pages/approvals/ApplicationDetailPage';
import ReportsDashboardPage from './pages/reports/ReportsDashboardPage';
import UsersPage from './pages/system/UsersPage';
import AuditLogsPage from './pages/system/AuditLogsPage';
import PostsPage from './pages/cms/PostsPage';
import VietcombankPublicPortal from './pages/portal/VietcombankPublicPortal';
import DisputesPage from './pages/staff/DisputesPage';
import AdvisoriesPage from './pages/staff/AdvisoriesPage';
import SupportTicketsPage from './pages/staff/SupportTicketsPage';
import FinancialTransactionsPage from './pages/staff/FinancialTransactionsPage';
import PlaceholderPage from './pages/PlaceholderPage';

// Customer Portal Pages
import CustomerLoginPage from './pages/customer/CustomerLoginPage';
import CustomerRegisterPage from './pages/customer/CustomerRegisterPage';
import CustomerDashboardPage from './pages/customer/CustomerDashboardPage';
import MyApplicationsPage from './pages/customer/MyApplicationsPage';
import ConsumerLoanPage from './pages/customer/ConsumerLoanPage';
import AutoLoanPage from './pages/customer/AutoLoanPage';
import CreditCardPage from './pages/customer/CreditCardPage';
import SavingsPage from './pages/customer/SavingsPage';
import BusinessLoanPage from './pages/customer/BusinessLoanPage';
import TradeFinancePage from './pages/customer/TradeFinancePage';
import CashFlowPage from './pages/customer/CashFlowPage';
import CustomerTransactionsPage from './pages/customer/CustomerTransactionsPage';

/** Route yêu cầu đăng nhập nội bộ (Admin/Manager/Staff) kèm kiểm tra quyền hạn (RBAC). */
function ProtectedAdmin({ children, permissions = [] }) {
  const { isLoggedIn, user } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  if (permissions.length > 0) {
    const isAdmin = user?.roles?.includes('ROLE_ADMIN');
    if (!isAdmin) {
      const hasPermission = user?.permissions?.some((p) => permissions.includes(p));
      if (!hasPermission) {
        return (
          <MainLayout>
            <div style={{ padding: '48px 24px', textAlign: 'center', background: '#fff', borderRadius: 8, margin: '24px auto', maxWidth: 650 }}>
              <Result
                status="403"
                title="403 - Từ chối truy cập"
                subTitle="Tài khoản của bạn không được phân quyền truy cập chức năng này. Vui lòng liên hệ Quản trị viên hệ thống để được cấp quyền."
                extra={
                  <Button type="primary" style={{ background: '#005030', borderColor: '#005030' }} onClick={() => (window.location.hash = '#/')}>
                    Về Trang Tổng Quan
                  </Button>
                }
              />
            </div>
          </MainLayout>
        );
      }
    }
  }

  return <MainLayout>{children}</MainLayout>;
}

/** Route yêu cầu đăng nhập Cổng khách hàng; chưa login -> chuyển sang /customer/login. */
function ProtectedCustomer({ children }) {
  const { isCustomerLoggedIn } = useCustomerAuth();
  if (!isCustomerLoggedIn) return <Navigate to="/customer/login" replace />;
  return <CustomerLayout>{children}</CustomerLayout>;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CustomerAuthProvider>
          <HashRouter>
            <Routes>
              {/* Cổng thông tin khách hàng Vietcombank (Public Web) */}
              <Route path="/portal" element={<VietcombankPublicPortal />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Cổng Khách Hàng (Customer Portal) */}
              <Route path="/customer/login" element={<CustomerLoginPage />} />
              <Route path="/customer/register" element={<CustomerRegisterPage />} />
              <Route path="/customer" element={<Navigate to="/customer/dashboard" replace />} />
              <Route path="/customer/dashboard" element={<ProtectedCustomer><CustomerDashboardPage /></ProtectedCustomer>} />
              <Route path="/customer/my-applications" element={<ProtectedCustomer><MyApplicationsPage /></ProtectedCustomer>} />
              <Route path="/customer/loans/consumer" element={<ProtectedCustomer><ConsumerLoanPage /></ProtectedCustomer>} />
              <Route path="/customer/loans/auto" element={<ProtectedCustomer><AutoLoanPage /></ProtectedCustomer>} />
              <Route path="/customer/cards" element={<ProtectedCustomer><CreditCardPage /></ProtectedCustomer>} />
              <Route path="/customer/savings" element={<ProtectedCustomer><SavingsPage /></ProtectedCustomer>} />
              <Route path="/customer/loans/business" element={<ProtectedCustomer><BusinessLoanPage /></ProtectedCustomer>} />
              <Route path="/customer/trade-finance" element={<ProtectedCustomer><TradeFinancePage /></ProtectedCustomer>} />
              <Route path="/customer/cash-flow" element={<ProtectedCustomer><CashFlowPage /></ProtectedCustomer>} />
              <Route path="/customer/transactions" element={<ProtectedCustomer><CustomerTransactionsPage /></ProtectedCustomer>} />

              {/* Bảng điều khiển quản trị (Mọi người dùng nội bộ đều có thể xem) */}
              <Route path="/" element={<ProtectedAdmin><DashboardPage /></ProtectedAdmin>} />

              {/* Phân hệ Nghiệp vụ Nhân viên ngân hàng (Staff) */}
              <Route path="/staff/advisories" element={<ProtectedAdmin permissions={['STAFF_CUSTOMER_ADVISORY']}><AdvisoriesPage /></ProtectedAdmin>} />
              <Route path="/staff/disputes" element={<ProtectedAdmin permissions={['STAFF_DISPUTE_HANDLE']}><DisputesPage /></ProtectedAdmin>} />
              <Route path="/staff/tickets" element={<ProtectedAdmin permissions={['STAFF_SUPPORT_TICKET']}><SupportTicketsPage /></ProtectedAdmin>} />
              <Route path="/staff/transactions" element={<ProtectedAdmin permissions={['STAFF_FINANCIAL_TX']}><FinancialTransactionsPage /></ProtectedAdmin>} />

              {/* Module 2: Dữ liệu biến động (Chỉ người có quyền DATA_UPDATE_RATES) */}
              <Route path="/data/exchange-rates" element={<ProtectedAdmin permissions={['DATA_UPDATE_RATES']}><ExchangeRatesPage /></ProtectedAdmin>} />
              <Route path="/data/gold-rates" element={<ProtectedAdmin permissions={['DATA_UPDATE_RATES']}><GoldRatesPage /></ProtectedAdmin>} />
              <Route path="/data/interest-rates" element={<ProtectedAdmin permissions={['DATA_UPDATE_RATES']}><InterestRatesPage /></ProtectedAdmin>} />
              <Route path="/data/fee-templates" element={<ProtectedAdmin permissions={['DATA_UPDATE_RATES']}><FeeTemplatesPage /></ProtectedAdmin>} />

              {/* Module 3: Phê duyệt hồ sơ (Quản lý APPROVE_LOAN) */}
              <Route path="/approvals" element={<ProtectedAdmin permissions={['APPROVE_LOAN']}><ApplicationsPage /></ProtectedAdmin>} />
              <Route path="/approvals/:id" element={<ProtectedAdmin permissions={['APPROVE_LOAN']}><ApplicationDetailPage /></ProtectedAdmin>} />

              {/* Module 4: Báo cáo & thống kê (Quản lý REPORT_EXPORT) */}
              <Route path="/reports/dashboard" element={<ProtectedAdmin permissions={['REPORT_EXPORT']}><ReportsDashboardPage /></ProtectedAdmin>} />

              {/* Module 5: RBAC Quản lý tài khoản & phân quyền (Chỉ SYS_MANAGE_USERS) */}
              <Route path="/system/users" element={<ProtectedAdmin permissions={['SYS_MANAGE_USERS']}><UsersPage /></ProtectedAdmin>} />

              {/* Module 6: CMS Bài viết & Audit Logs (Chỉ SYS_MANAGE_USERS hoặc CMS_MANAGE_POST) */}
              <Route path="/system/audit-logs" element={<ProtectedAdmin permissions={['SYS_MANAGE_USERS']}><AuditLogsPage /></ProtectedAdmin>} />
              <Route path="/cms/posts" element={<ProtectedAdmin permissions={['CMS_MANAGE_POST']}><PostsPage /></ProtectedAdmin>} />

              {/* Fallback */}
              <Route path="*" element={<ProtectedAdmin><PlaceholderPage /></ProtectedAdmin>} />
            </Routes>
          </HashRouter>
        </CustomerAuthProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
