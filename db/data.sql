USE admin_portal_db;

-- ==========================================
-- 1. DỮ LIỆU MẪU: HỆ THỐNG & PHÂN QUYỀN
-- ==========================================

INSERT INTO roles (role_id, role_code, role_name, description) VALUES
(1, 'ROLE_ADMIN', 'Quản trị hệ thống', 'Có toàn bộ quyền trong hệ thống'),
(2, 'ROLE_MANAGER', 'Quản lý phê duyệt', 'Duyệt hồ sơ, hạn mức và xem báo cáo'),
(3, 'ROLE_STAFF', 'Nhân viên nghiệp vụ', 'Thực hiện tư vấn, tra soát, hỗ trợ và giao dịch tài chính')
ON DUPLICATE KEY UPDATE role_name=VALUES(role_name), description=VALUES(description);

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name) VALUES
(1, 'SYS_MANAGE_USERS', 'Tạo và phân quyền tài khoản', 'System'),
(2, 'DATA_UPDATE_RATES', 'Cập nhật tỷ giá & lãi suất', 'FluctuatingData'),
(3, 'APPROVE_LOAN', 'Phê duyệt hồ sơ vay & mở thẻ', 'Approval'),
(4, 'REPORT_EXPORT', 'Xem và xuất file báo cáo', 'Report'),
(5, 'CMS_MANAGE_POST', 'Thêm mới và sửa bài viết', 'CMS'),
(6, 'STAFF_CUSTOMER_ADVISORY', 'Tư vấn và quản lý khách hàng', 'StaffModule'),
(7, 'STAFF_SUPPORT_TICKET', 'Tiếp nhận và hỗ trợ CSKH', 'StaffModule'),
(8, 'STAFF_DISPUTE_HANDLE', 'Xử lý yêu cầu tra soát', 'StaffModule'),
(9, 'STAFF_FINANCIAL_TX', 'Thực hiện giao dịch tài chính', 'StaffModule')
ON DUPLICATE KEY UPDATE permission_name=VALUES(permission_name), module_name=VALUES(module_name);

INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), -- Admin full
(2, 3), (2, 4),                                                         -- Manager
(3, 6), (3, 7), (3, 8), (3, 9);                                         -- Staff

INSERT INTO users (user_id, username, password_hash, email, full_name, phone_number, status) VALUES
(101, 'admin_super', '$2a$12$eImiTXuWVxfM37uY4JANjOL.8/OHq8pM.a3T28eGv6g3u1r123456', 'admin@bank.com', 'Nguyễn Văn Admin', '0901234567', 'ACTIVE'),
(102, 'manager_dev', '$2a$12$eImiTXuWVxfM37uY4JANjOL.8/OHq8pM.a3T28eGv6g3u1r654321', 'manager@bank.com', 'Trần Thị Duyệt', '0912345678', 'ACTIVE'),
(103, 'nv_hoangnam', '$2a$12$eImiTXuWVxfM37uY4JANjOL.8/OHq8pM.a3T28eGv6g3u1r999999', 'nam.nv@bank.com', 'Nguyễn Hoàng Nam', '0933444555', 'ACTIVE')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), phone_number=VALUES(phone_number);

INSERT IGNORE INTO user_roles (user_id, role_id) VALUES
(101, 1),
(102, 2),
(103, 3);

INSERT INTO staff_profiles (staff_id, employee_code, department, position) VALUES
(103, 'NV-2026-089', 'Dịch vụ Khách hàng', 'Chuyên viên Quản lý & Tư vấn')
ON DUPLICATE KEY UPDATE department=VALUES(department), position=VALUES(position);

-- ==========================================
-- 2. DỮ LIỆU MẪU: AUDIT LOG
-- ==========================================

INSERT INTO audit_logs (user_id, action_type, module_name, ip_address, status, description, payload_after) VALUES
(101, 'LOGIN_SUCCESS', 'Authentication', '192.168.1.15', 'SUCCESS', 'Admin đăng nhập thành công qua OTP', '{"method": "2FA_OTP"}'),
(101, 'UPDATE_INTEREST_RATE', 'FluctuatingData', '192.168.1.15', 'SUCCESS', 'Cập nhật lãi suất tiết kiệm kỳ hạn 12T', '{"term": 12, "new_rate": 6.8}'),
(102, 'APPROVE_APPLICATION', 'Approval', '192.168.1.20', 'SUCCESS', 'Phê duyệt hồ sơ vay vốn APP-2026-001', '{"app_code": "APP-2026-001", "decision": "APPROVED"}');

-- ==========================================
-- 3. DỮ LIỆU MẪU: CẬP NHẬT DỮ LIỆU BIẾN ĐỘNG
-- ==========================================

INSERT IGNORE INTO exchange_rates (currency_code, buy_rate, sell_rate, transfer_rate, effective_date, created_by) VALUES
('USD', 25400.0000, 25800.0000, 25430.0000, '2026-08-24', 101),
('EUR', 27200.0000, 27950.0000, 27300.0000, '2026-08-24', 101);

INSERT INTO gold_rates (gold_type, buy_price, sell_price, effective_date, created_by) VALUES
('SJC', 84000000.00, 86000000.00, '2026-08-24', 101),
('24K Ring', 77000000.00, 78500000.00, '2026-08-24', 101);

INSERT INTO interest_rates (product_code, term_months, rate_percentage, effective_date, created_by) VALUES
('SAVING_ONLINE', 6, 5.20, '2026-08-01', 101),
('SAVING_ONLINE', 12, 6.80, '2026-08-01', 101),
('LOAN_MORTGAGE', 12, 8.50, '2026-08-01', 101);

INSERT INTO fee_templates (title, file_path, file_type, is_active, created_by) VALUES
('Bảng biểu phí dịch vụ thẻ 2026', '/uploads/fees/bieu_phi_the_2026.xlsx', 'EXCEL', TRUE, 101);

-- ==========================================
-- 4. KHÁCH HÀNG & CHI TIẾT VAY (INDIVIDUAL / ENTERPRISE)
-- ==========================================

INSERT INTO customers (customer_id, full_name, customer_type, id_card_number, phone_number, email) VALUES
(501, 'Lê Hoàng Nam', 'INDIVIDUAL', '001098001234', '0988777666', 'nam.le@gmail.com'),
(502, 'Phạm Minh Anh', 'INDIVIDUAL', '001099005678', '0977111222', 'minhanh@gmail.com'),
(601, 'Trần Thị Thu Hà', 'INDIVIDUAL', '001198004567', '0911222333', 'ha.tran@gmail.com'),
(602, 'Công ty TNHH Giải Pháp Công Nghệ ABC', 'ENTERPRISE', '0101234567', '0243999888', 'contact@abc-tech.vn')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), customer_type=VALUES(customer_type);

INSERT INTO individual_customers (customer_id, date_of_birth, gender, monthly_income, company_name, position) VALUES
(601, '1998-05-15', 'FEMALE', 25000000.00, 'Công ty FPT Software', 'Kỹ sư phần mềm')
ON DUPLICATE KEY UPDATE monthly_income=VALUES(monthly_income);

INSERT INTO enterprise_customers (customer_id, tax_code, company_name, representative_name, business_license_number, charter_capital) VALUES
(602, '0101234567', 'Công ty TNHH Giải Pháp Công Nghệ ABC', 'Nguyễn Văn Doanh', 'GPKD-2020-888', 5000000000.00)
ON DUPLICATE KEY UPDATE representative_name=VALUES(representative_name);

-- ==========================================
-- 5. HỒ SƠ PHÊ DUYỆT & VAY CHI TIẾT
-- ==========================================

INSERT INTO applications (application_id, application_code, customer_id, application_type, requested_amount, status) VALUES
(1001, 'APP-2026-001', 501, 'LOAN', 500000000.00, 'APPROVED'),
(1002, 'APP-2026-002', 502, 'CARD_ISSUANCE', 50000000.00, 'DOCS_REQUIRED'),
(2001, 'APP-CONSUMER-001', 601, 'LOAN', 100000000.00, 'PENDING'),
(2002, 'APP-AUTO-002', 601, 'LOAN', 500000000.00, 'PENDING')
ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT INTO loan_applications (loan_app_id, application_id, loan_purpose, loan_amount, loan_term_months, interest_rate_percentage) VALUES
(3001, 2001, 'CONSUMER', 100000000.00, 24, 9.50),
(3002, 2002, 'AUTO', 500000000.00, 60, 8.50)
ON DUPLICATE KEY UPDATE loan_amount=VALUES(loan_amount);

INSERT INTO car_loan_details (loan_app_id, car_brand, car_model, manufacture_year, car_price, is_new_car) VALUES
(3002, 'Honda', 'CR-V L', 2026, 1100000000.00, TRUE)
ON DUPLICATE KEY UPDATE car_price=VALUES(car_price);

INSERT INTO loan_collaterals (loan_app_id, collateral_type, collateral_name, estimated_value, document_proof_url) VALUES
(3002, 'CAR', 'Xe Ô tô Honda CR-V L 2026 (Chính chiếc xe mua)', 1100000000.00, '/uploads/loans/2002/car_quote.pdf');

INSERT INTO loan_schedules (loan_app_id, period_number, due_date, principal_amount, interest_amount, total_payment) VALUES
(3002, 1, '2026-09-24', 8333333.33, 3541666.67, 11875000.00),
(3002, 2, '2026-10-24', 8333333.33, 3482638.89, 11815972.22);

INSERT INTO application_documents (application_id, document_name, file_url) VALUES
(1001, 'Căn cước công dân_Nam.pdf', '/docs/apps/1001/cccd.pdf'),
(1001, 'Sao kê lương 3 tháng.pdf', '/docs/apps/1001/saoke.pdf'),
(1002, 'Chứng minh thu nhập.pdf', '/docs/apps/1002/thunhap.pdf'),
(2001, 'Bang_luong_3_thang.pdf', '/uploads/loans/2001/bang_luong.pdf'),
(2001, 'Hop_dong_lao_dong.pdf', '/uploads/loans/2001/hdlv.pdf');

INSERT INTO application_approvals (application_id, manager_id, action, reason_note) VALUES
(1001, 102, 'APPROVED', 'Hồ sơ đầy đủ điều kiện tín dụng, thu nhập tốt.'),
(1002, 102, 'REQUEST_DOCS', 'Thiếu hợp đồng lao động bản gốc, yêu cầu bổ sung.');

-- ==========================================
-- 6. PHÂN HỆ NHÂN VIÊN (STAFF OPERATIONS)
-- ==========================================

-- Mẫu Tra soát (Dispute)
INSERT INTO dispute_requests (dispute_id, dispute_code, customer_id, transaction_code, reason, status, handler_staff_id, resolution_note) VALUES
(2001, 'TS-2026-001', 501, 'FT2608240012', 'Chuyển tiền tài khoản bị trừ nhưng người nhận chưa nhận được', 'PROCESSING', 103, 'Đã kiểm tra Core Banking, đang tra soát liên ngân hàng')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- Mẫu Tư vấn CRM (Customer Advisory)
INSERT INTO customer_advisories (customer_id, staff_id, product_type, notes, status) VALUES
(501, 103, 'Tiết kiệm Online 12 tháng', 'Khách hàng quan tâm lãi suất 6.8%, hẹn nộp tiền tuần sau', 'FOLLOW_UP');

-- Mẫu Hỗ trợ Ticket CSKH
INSERT INTO support_tickets (ticket_id, ticket_code, customer_id, assigned_staff_id, title, content, status) VALUES
(3001, 'TK-2026-005', 502, 103, 'Quên mật khẩu Mobile Banking', 'Khách hàng yêu cầu cấp lại mật khẩu ứng dụng điện thoại', 'RESOLVED')
ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT INTO support_ticket_logs (ticket_id, staff_id, action_note) VALUES
(3001, 103, 'Đã xác minh CMND/CCCD qua điện thoại và gửi OTP reset mật khẩu cho khách hàng.');

-- Mẫu Giao dịch tài chính (Financial Transactions)
INSERT INTO financial_transactions (transaction_id, transaction_code, sender_customer_id, receiver_account_number, receiver_name, amount, fee, description, processed_by_staff_id, status) VALUES
(10001, 'TXN-2026-082401', 501, '1903888999', 'Trần Văn B', 15000000.00, 0.00, 'Chuyển tiền thanh toán hợp đồng', 103, 'SUCCESS')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- ==========================================
-- 7. CMS TIN TỨC & BÁO CÁO EXPORT
-- ==========================================

INSERT INTO categories (category_id, category_name, slug) VALUES
(1, 'Tin tức ngân hàng', 'tin-tuc-ngan-hang'),
(2, 'Ưu đãi thẻ', 'uu-dai-the')
ON DUPLICATE KEY UPDATE category_name=VALUES(category_name);

INSERT INTO posts (title, slug, summary, content, thumbnail_url, category_id, author_id, status, published_at) VALUES
('Điều chỉnh biểu phí và lãi suất tháng 8/2026', 'dieu-chinh-lai-suat-thang-8-2026', 'Thông báo thay đổi biểu phí giao dịch và lãi suất gửi tiết kiệm mới nhất.', '<p>Nội dung chi tiết về thay đổi biểu phí áp dụng từ ngày 24/08/2026...</p>', '/images/posts/news1.png', 1, 101, 'PUBLISHED', '2026-08-24 09:00:00')
ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT INTO report_exports (user_id, report_type, filter_params, file_format, file_path) VALUES
(101, 'EXCHANGE_RATE_REPORT', '{"from_date": "2026-08-01", "to_date": "2026-08-24", "currency": "ALL"}', 'EXCEL', '/exports/reports/Ty_Gia_Thang_8_2026.xlsx'),
(102, 'LOAN_SUMMARY', '{"status": "APPROVED", "month": 8, "year": 2026}', 'PDF', '/exports/reports/Bao_Cao_Phe_Duyet_T8.pdf');
