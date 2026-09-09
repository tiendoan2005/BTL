const http = require('http');

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const dataStr = body ? JSON.stringify(body) : null;
    const reqHeaders = { ...headers };
    if (dataStr) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(dataStr);
    }
    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (dataStr) req.write(dataStr);
    req.end();
  });
}

async function run() {
  const results = [];
  function record(actor, moduleName, method, endpoint, res, checkSuccess) {
    const isOk = checkSuccess(res);
    results.push({
      actor,
      moduleName,
      method,
      endpoint,
      status: res.status,
      result: isOk ? 'PASS' : 'FAIL',
      sample: typeof res.body === 'object' ? JSON.stringify(res.body).substring(0, 80) + '...' : String(res.body).substring(0, 80)
    });
  }

  // 1. PUBLIC APIS (Khách vãng lai)
  let r = await request('GET', '/api/v1/public/rates/exchange');
  record('Khách vãng lai', 'Tỷ giá ngoại tệ trực tuyến', 'GET', '/api/v1/public/rates/exchange', r, res => res.status === 200 && res.body.success);

  r = await request('GET', '/api/v1/public/rates/gold');
  record('Khách vãng lai', 'Giá vàng SJC', 'GET', '/api/v1/public/rates/gold', r, res => res.status === 200 && res.body.success);

  r = await request('GET', '/api/v1/public/rates/interest');
  record('Khách vãng lai', 'Lãi suất tiết kiệm niêm yết', 'GET', '/api/v1/public/rates/interest', r, res => res.status === 200 && res.body.success);

  r = await request('GET', '/api/v1/public/posts');
  record('Khách vãng lai', 'Tin tức & Ưu đãi CMS', 'GET', '/api/v1/public/posts', r, res => res.status === 200 && res.body.success);

  r = await request('POST', '/api/v1/public/apply', {
    fullName: 'Trần Văn Test Public',
    idCardNumber: '001299334455',
    phoneNumber: '0912334455',
    email: 'public@test.com',
    applicationType: 'LOAN',
    requestedAmount: 45000000,
    note: 'Nộp hồ sơ vay online'
  });
  record('Khách vãng lai', 'Nộp hồ sơ trực tuyến nhanh', 'POST', '/api/v1/public/apply', r, res => res.status === 201 && res.body.success);

  // 2. KHÁCH HÀNG CÁ NHÂN (Individual Customer)
  const uid = Date.now().toString().slice(-4);
  r = await request('POST', '/api/v1/customer/auth/register', {
    username: 'kh_api_' + uid,
    password: 'Customer@123',
    fullName: 'Đoàn Văn API ' + uid,
    customerType: 'INDIVIDUAL',
    idCardNumber: '0012999' + uid,
    phoneNumber: '0977' + uid,
    email: 'cust' + uid + '@vcb.com'
  });
  record('Khách hàng CN', 'Đăng ký tài khoản mới (Register)', 'POST', '/api/v1/customer/auth/register', r, res => res.status === 200 && res.body.success);

  // Login cá nhân
  r = await request('POST', '/api/v1/customer/auth/login', { username: 'kh_thuha', password: 'Customer@123' });
  const custToken = r.body?.data?.accessToken;
  const custHeaders = { 'Authorization': 'Bearer ' + custToken };
  record('Khách hàng CN', 'Đăng nhập e-Banking (Login)', 'POST', '/api/v1/customer/auth/login', r, res => res.status === 200 && !!custToken);

  r = await request('GET', '/api/v1/customer/profile', null, custHeaders);
  record('Khách hàng CN', 'Xem thông tin Profile cá nhân', 'GET', '/api/v1/customer/profile', r, res => res.status === 200 && res.body.success);

  r = await request('GET', '/api/v1/customer/my-applications', null, custHeaders);
  record('Khách hàng CN', 'Tra cứu tiến độ hồ sơ cá nhân', 'GET', '/api/v1/customer/my-applications', r, res => res.status === 200 && res.body.success);

  r = await request('POST', '/api/v1/customer/loans/consumer', {
    requestedAmount: 35000000,
    termMonths: 12,
    incomeProofDocUrl: 'https://vcb.com.vn/docs/salary.pdf'
  }, custHeaders);
  record('Khách hàng CN', 'Đăng ký Vay tiêu dùng tín chấp', 'POST', '/api/v1/customer/loans/consumer', r, res => res.status === 200 && res.body.success);

  r = await request('POST', '/api/v1/customer/loans/auto', {
    requestedAmount: 300000000,
    termMonths: 48,
    carBrand: 'Toyota',
    carModel: 'Corolla Cross',
    manufactureYear: 2024,
    carPrice: 850000000,
    isNewCar: true,
    carQuoteDocUrl: 'https://vcb.com.vn/docs/quote.pdf'
  }, custHeaders);
  record('Khách hàng CN', 'Đăng ký Vay mua ô tô', 'POST', '/api/v1/customer/loans/auto', r, res => res.status === 200 && res.body.success);

  r = await request('POST', '/api/v1/customer/cards', {
    requestedLimit: 50000000,
    cardCategory: 'VISA_PLATINUM',
    proofDocUrl: 'https://vcb.com.vn/docs/card_proof.pdf'
  }, custHeaders);
  record('Khách hàng CN', 'Mở thẻ tín dụng quốc tế', 'POST', '/api/v1/customer/cards', r, res => res.status === 200 && res.body.success);

  r = await request('POST', '/api/v1/customer/savings', {
    productCode: 'TK_ONLINE_6M',
    depositAmount: 20000000,
    termMonths: 6
  }, custHeaders);
  record('Khách hàng CN', 'Mở sổ tiết kiệm Online', 'POST', '/api/v1/customer/savings', r, res => res.status === 200 && res.body.success);

  r = await request('GET', '/api/v1/customer/savings', null, custHeaders);
  record('Khách hàng CN', 'Danh sách sổ tiết kiệm', 'GET', '/api/v1/customer/savings', r, res => res.status === 200 && res.body.success);

  r = await request('GET', '/api/v1/customer/transactions', null, custHeaders);
  record('Khách hàng CN', 'Lịch sử giao dịch tài chính', 'GET', '/api/v1/customer/transactions', r, res => res.status === 200 && res.body.success);

  // 3. KHÁCH HÀNG DOANH NGHIỆP (Enterprise Customer)
  r = await request('POST', '/api/v1/customer/auth/login', { username: 'dn_abctech', password: 'Customer@123' });
  const entToken = r.body?.data?.accessToken;
  const entHeaders = { 'Authorization': 'Bearer ' + entToken };
  record('Khách hàng DN', 'Đăng nhập DN (Login)', 'POST', '/api/v1/customer/auth/login', r, res => res.status === 200 && !!entToken);

  r = await request('POST', '/api/v1/customer/loans/business', {
    requestedAmount: 1500000000,
    termMonths: 24,
    businessPlanSummary: 'Mở rộng dây chuyền sản xuất bo mạch điện tử',
    financialReportDocUrl: 'https://vcb.com.vn/docs/bctc_2025.pdf'
  }, entHeaders);
  record('Khách hàng DN', 'Đăng ký vay SXKD Doanh nghiệp', 'POST', '/api/v1/customer/loans/business', r, res => res.status === 200 && res.body.success);

  r = await request('POST', '/api/v1/customer/trade-finance', {
    serviceType: 'LETTER_OF_CREDIT',
    amount: 500000000,
    currency: 'VND',
    beneficiaryName: 'Foxconn Int Global',
    purpose: 'Thư tín dụng nhập khẩu linh kiện',
    documentUrl: 'https://vcb.com.vn/docs/lc.pdf'
  }, entHeaders);
  record('Khách hàng DN', 'Phát hành bảo lãnh / L/C', 'POST', '/api/v1/customer/trade-finance', r, res => res.status === 200 && res.body.success);

  r = await request('GET', '/api/v1/customer/trade-finance', null, entHeaders);
  record('Khách hàng DN', 'Danh sách hồ sơ bảo lãnh & L/C', 'GET', '/api/v1/customer/trade-finance', r, res => res.status === 200 && res.body.success);

  r = await request('GET', '/api/v1/customer/cash-flow', null, entHeaders);
  record('Khách hàng DN', 'Quản lý Dòng tiền Cash Flow', 'GET', '/api/v1/customer/cash-flow', r, res => res.status === 200 && res.body.success);

  // 4. ADMIN & STAFF 2FA AUTH
  r = await request('POST', '/api/v1/auth/login', { username: 'admin_super', password: 'Admin@123' });
  const tempToken = r.body?.data?.tempToken;
  const devOtp = r.body?.data?.devOtp;
  record('Cán bộ / Admin', 'Đăng nhập Bước 1 (User/Pass)', 'POST', '/api/v1/auth/login', r, res => res.status === 200 && !!devOtp);

  r = await request('POST', '/api/v1/auth/verify-otp', {
    username: 'admin_super',
    tempToken: tempToken,
    otpCode: devOtp
  });
  const adminToken = r.body?.data?.accessToken;
  const adminHeaders = { 'Authorization': 'Bearer ' + adminToken };
  record('Cán bộ / Admin', 'Xác thực Bước 2 (2FA OTP)', 'POST', '/api/v1/auth/verify-otp', r, res => res.status === 200 && !!adminToken);

  // 5. STAFF OPERATIONS
  r = await request('GET', '/api/v1/staff/advisories', null, adminHeaders);
  record('Cán bộ Staff', 'Danh sách Tư vấn CRM', 'GET', '/api/v1/staff/advisories', r, res => res.status === 200 && res.body.success);

  r = await request('GET', '/api/v1/staff/disputes', null, adminHeaders);
  record('Cán bộ Staff', 'Xử lý Tra soát khiếu nại', 'GET', '/api/v1/staff/disputes', r, res => res.status === 200 && res.body.success);

  r = await request('GET', '/api/v1/staff/tickets', null, adminHeaders);
  record('Cán bộ Staff', 'Tiếp nhận Ticket CSKH', 'GET', '/api/v1/staff/tickets', r, res => res.status === 200 && res.body.success);

  r = await request('GET', '/api/v1/staff/transactions', null, adminHeaders);
  record('Cán bộ Staff', 'Giám sát Giao dịch tài chính', 'GET', '/api/v1/staff/transactions', r, res => res.status === 200 && res.body.success);

  // 6. MANAGER & APPROVAL
  r = await request('GET', '/api/v1/applications', null, adminHeaders);
  record('Cán bộ Quản lý', 'Danh sách Hồ sơ thẩm định', 'GET', '/api/v1/applications', r, res => res.status === 200 && res.body.success);

  const firstApp = r.body?.data?.content?.[0] || r.body?.data?.[0];
  if (firstApp && firstApp.id) {
    r = await request('GET', '/api/v1/applications/' + firstApp.id, null, adminHeaders);
    record('Cán bộ Quản lý', 'Chi tiết Hồ sơ thẩm định', 'GET', '/api/v1/applications/:id', r, res => res.status === 200 && res.body.success);
  }

  r = await request('GET', '/api/v1/exchange-rates', null, adminHeaders);
  record('Cán bộ Quản lý', 'Quản trị Tỷ giá ngoại tệ', 'GET', '/api/v1/exchange-rates', r, res => res.status === 200 && res.body.success);

  r = await request('GET', '/api/v1/gold-rates', null, adminHeaders);
  record('Cán bộ Quản lý', 'Quản trị Giá vàng SJC', 'GET', '/api/v1/gold-rates', r, res => res.status === 200 && res.body.success);

  r = await request('GET', '/api/v1/interest-rates', null, adminHeaders);
  record('Cán bộ Quản lý', 'Quản trị Biểu lãi suất', 'GET', '/api/v1/interest-rates', r, res => res.status === 200 && res.body.success);

  r = await request('GET', '/api/v1/fee-templates', null, adminHeaders);
  record('Cán bộ Quản lý', 'Quản trị Biểu phí & Biểu mẫu', 'GET', '/api/v1/fee-templates', r, res => res.status === 200 && res.body.success);

  r = await request('GET', '/api/v1/reports/dashboard', null, adminHeaders);
  record('Cán bộ Quản lý', 'Dashboard Báo cáo Tài chính', 'GET', '/api/v1/reports/dashboard', r, res => res.status === 200 && res.body.success);

  // 7. SUPER ADMIN & SYSTEM
  r = await request('GET', '/api/v1/system/users', null, adminHeaders);
  record('Quản trị viên', 'Quản lý Tài khoản Cán bộ', 'GET', '/api/v1/system/users', r, res => res.status === 200 && res.body.success);

  r = await request('GET', '/api/v1/system/roles', null, adminHeaders);
  record('Quản trị viên', 'Quản trị Vai trò & Quyền RBAC', 'GET', '/api/v1/system/roles', r, res => res.status === 200 && res.body.success);

  r = await request('GET', '/api/v1/system/audit-logs', null, adminHeaders);
  record('Quản trị viên', 'Nhật ký Kiểm toán Audit Logs', 'GET', '/api/v1/system/audit-logs', r, res => res.status === 200 && res.body.success);

  r = await request('GET', '/api/v1/cms/posts', null, adminHeaders);
  record('Quản trị viên', 'Quản lý Bài viết CMS', 'GET', '/api/v1/cms/posts', r, res => res.status === 200 && res.body.success);

  console.log(JSON.stringify(results, null, 2));
}

run().catch(console.error);
