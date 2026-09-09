CREATE DATABASE IF NOT EXISTS admin_portal_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE admin_portal_db;


-- ADMIN



-- ==========================================
-- 1. QUẢN LÝ HỆ THỐNG & PHÂN QUYỀN (RBAC)
-- ==========================================

CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_code VARCHAR(50) NOT NULL UNIQUE, -- VD: 'ROLE_ADMIN', 'ROLE_MANAGER'
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    permission_id INT AUTO_INCREMENT PRIMARY KEY,
    permission_code VARCHAR(100) NOT NULL UNIQUE, -- VD: 'POST_CREATE', 'APPLICATION_APPROVE'
    permission_name VARCHAR(150) NOT NULL,
    module_name VARCHAR(50) NOT NULL, -- Phân loại module
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE
);

CREATE TABLE users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    status ENUM('ACTIVE', 'INACTIVE', 'LOCKED') DEFAULT 'ACTIVE',
    otp_secret VARCHAR(100) NULL, -- Dùng cho xắc thực OTP
    otp_expiry TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
);

-- ==========================================
-- 2. AUDIT LOG (GHI VẾT HỆ THỐNG)
-- ==========================================

CREATE TABLE audit_logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL, -- Nullable cho các action hệ thống hoặc đăng nhập thất bại
    action_type VARCHAR(100) NOT NULL, -- 'LOGIN_SUCCESS', 'UPDATE_INTEREST_RATE', 'APPROVE_LOAN'
    module_name VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    status ENUM('SUCCESS', 'FAILED') NOT NULL,
    description TEXT,
    payload_before JSON NULL, -- Lưu trạng thái dữ liệu trước khi đổi
    payload_after JSON NULL,  -- Lưu trạng thái dữ liệu sau khi đổi
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user_action (user_id, action_type),
    INDEX idx_created_at (created_at)
);

-- ==========================================
-- 3. CẬP NHẬT DỮ LIỆU BIẾN ĐỘNG
-- ==========================================

CREATE TABLE exchange_rates (
    rate_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    currency_code VARCHAR(10) NOT NULL, -- USD, EUR, JPY
    buy_rate DECIMAL(18, 4) NOT NULL,
    sell_rate DECIMAL(18, 4) NOT NULL,
    transfer_rate DECIMAL(18, 4) NOT NULL,
    effective_date DATE NOT NULL,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    UNIQUE KEY uniq_currency_date (currency_code, effective_date)
);

CREATE TABLE gold_rates (
    gold_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    gold_type VARCHAR(50) NOT NULL, -- SJC, 24K, 18K
    buy_price DECIMAL(18, 2) NOT NULL,
    sell_price DECIMAL(18, 2) NOT NULL,
    effective_date DATE NOT NULL,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE TABLE interest_rates (
    rate_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_code VARCHAR(50) NOT NULL, -- 'SAVING_3M', 'LOAN_MORTGAGE'
    term_months INT NOT NULL, -- Kỳ hạn (tháng)
    rate_percentage DECIMAL(5, 2) NOT NULL, -- % lãi suất
    effective_date DATE NOT NULL,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE TABLE fee_templates (
    template_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL, -- Lưu đường dẫn file đính kèm/excel
    file_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- ==========================================
-- 4. PHÊ DUYỆT HỒ SƠ & GIAO DỊCH
-- ==========================================

CREATE TABLE customers (
    customer_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    id_card_number VARCHAR(20) NOT NULL UNIQUE,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE applications (
    application_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_code VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    application_type ENUM('LOAN', 'CARD_ISSUANCE', 'LIMIT_APPROVAL') NOT NULL,
    requested_amount DECIMAL(18, 2) NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'DOCS_REQUIRED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE application_documents (
    document_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_id BIGINT NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE
);

CREATE TABLE application_approvals (
    approval_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_id BIGINT NOT NULL,
    manager_id BIGINT NOT NULL,
    action ENUM('APPROVED', 'REJECTED', 'REQUEST_DOCS') NOT NULL,
    reason_note TEXT NULL, -- Lý do từ chối hoặc yêu cầu bổ sung
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(application_id),
    FOREIGN KEY (manager_id) REFERENCES users(user_id)
);

-- ==========================================
-- 5. QUẢN TRỊ NỘI DUNG WEB (CMS)
-- ==========================================

CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE posts (
    post_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    summary TEXT,
    content LONGTEXT NOT NULL,
    thumbnail_url VARCHAR(500),
    category_id INT NULL,
    author_id BIGINT NOT NULL,
    status ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') DEFAULT 'DRAFT',
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    FOREIGN KEY (author_id) REFERENCES users(user_id)
);

-- ==========================================
-- 6. BÁO CÁO & THỐNG KÊ (EXPORT LOGS)
-- ==========================================

CREATE TABLE report_exports (
    export_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    report_type VARCHAR(100) NOT NULL, -- 'EXCHANGE_RATE_REPORT', 'LOAN_SUMMARY'
    filter_params JSON NOT NULL, -- Lưu bộ lọc: {"from_date": "2026-01-01", "to_date": "2026-08-24"}
    file_format ENUM('EXCEL', 'PDF', 'CSV') NOT NULL,
    file_path VARCHAR(500) NULL,
    exported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);


USE admin_portal_db;

-- ==========================================
-- 1. DỮ LIỆU MẪU: HỆ THỐNG & PHÂN QUYỀN
-- ==========================================

INSERT INTO roles (role_id, role_code, role_name, description) VALUES
(1, 'ROLE_ADMIN', 'Quản trị hệ thống', 'Có toàn bộ quyền trong hệ thống'),
(2, 'ROLE_MANAGER', 'Quản lý phê duyệt', 'Duyệt hồ sơ, hạn mức và xem báo cáo');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name) VALUES
(1, 'SYS_MANAGE_USERS', 'Tạo và phân quyền tài khoản', 'System'),
(2, 'DATA_UPDATE_RATES', 'Cập nhật tỷ giá & lãi suất', 'FluctuatingData'),
(3, 'APPROVE_LOAN', 'Phê duyệt hồ sơ vay & mở thẻ', 'Approval'),
(4, 'REPORT_EXPORT', 'Xem và xuất file báo cáo', 'Report'),
(5, 'CMS_MANAGE_POST', 'Thêm mới và sửa bài viết', 'CMS');

INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), -- Admin có đầy đủ quyền
(2, 3), (2, 4);                          -- Manager có quyền Duyệt & Báo cáo

INSERT INTO users (user_id, username, password_hash, email, full_name, phone_number, status) VALUES
(101, 'admin_super', '$2a$12$eImiTXuWVxfM37uY4JANjOL.8/OHq8pM.a3T28eGv6g3u1r123456', 'admin@bank.com', 'Nguyễn Văn Admin', '0901234567', 'ACTIVE'),
(102, 'manager_dev', '$2a$12$eImiTXuWVxfM37uY4JANjOL.8/OHq8pM.a3T28eGv6g3u1r654321', 'manager@bank.com', 'Trần Thị Duyệt', '0912345678', 'ACTIVE');

INSERT INTO user_roles (user_id, role_id) VALUES
(101, 1),
(102, 2);

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

INSERT INTO exchange_rates (currency_code, buy_rate, sell_rate, transfer_rate, effective_date, created_by) VALUES
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
-- 4. DỮ LIỆU MẪU: PHÊ DUYỆT HỒ SƠ & GIAO DỊCH
-- ==========================================

INSERT INTO customers (customer_id, full_name, id_card_number, phone_number, email) VALUES
(501, 'Lê Hoàng Nam', '001098001234', '0988777666', 'nam.le@gmail.com'),
(502, 'Phạm Minh Anh', '001099005678', '0977111222', 'minhanh@gmail.com');

INSERT INTO applications (application_id, application_code, customer_id, application_type, requested_amount, status) VALUES
(1001, 'APP-2026-001', 501, 'LOAN', 500000000.00, 'APPROVED'),
(1002, 'APP-2026-002', 502, 'CARD_ISSUANCE', 50000000.00, 'DOCS_REQUIRED');

INSERT INTO application_documents (application_id, document_name, file_url) VALUES
(1001, 'Căn cước công dân_Nam.pdf', '/docs/apps/1001/cccd.pdf'),
(1001, 'Sao kê lương 3 tháng.pdf', '/docs/apps/1001/saoke.pdf'),
(1002, 'Chứng minh thu nhập.pdf', '/docs/apps/1002/thunhap.pdf');

INSERT INTO application_approvals (application_id, manager_id, action, reason_note) VALUES
(1001, 102, 'APPROVED', 'Hồ sơ đầy đủ điều kiện tín dụng, thu nhập tốt.'),
(1002, 102, 'REQUEST_DOCS', 'Thiếu hợp đồng lao động bản gốc, yêu cầu bổ sung.');

-- ==========================================
-- 5. DỮ LIỆU MẪU: QUẢN TRỊ NỘI DUNG WEB (CMS)
-- ==========================================

INSERT INTO categories (category_id, category_name, slug) VALUES
(1, 'Tin tức ngân hàng', 'tin-tuc-ngan-hang'),
(2, 'Ưu đãi thẻ', 'uu-dai-the');

INSERT INTO posts (title, slug, summary, content, thumbnail_url, category_id, author_id, status, published_at) VALUES
('Điều chỉnh biểu phí và lãi suất tháng 8/2026', 'dieu-chinh-lai-suat-thang-8-2026', 'Thông báo thay đổi biểu phí giao dịch và lãi suất gửi tiết kiệm mới nhất.', '<p>Nội dung chi tiết về thay đổi biểu phí áp dụng từ ngày 24/08/2026...</p>', '/images/posts/news1.png', 1, 101, 'PUBLISHED', '2026-08-24 09:00:00');

-- ==========================================
-- 6. DỮ LIỆU MẪU: BÁO CÁO & THỐNG KÊ EXPORT
-- ==========================================

INSERT INTO report_exports (user_id, report_type, filter_params, file_format, file_path) VALUES
(101, 'EXCHANGE_RATE_REPORT', '{"from_date": "2026-08-01", "to_date": "2026-08-24", "currency": "ALL"}', 'EXCEL', '/exports/reports/Ty_Gia_Thang_8_2026.xlsx'),
(102, 'LOAN_SUMMARY', '{"status": "APPROVED", "month": 8, "year": 2026}', 'PDF', '/exports/reports/Bao_Cao_Phe_Duyet_T8.pdf');

-- ========================================================================== NHAN VIEN =============================================================

USE admin_portal_db;

-- ==========================================
-- A. HỒ SƠ CHI TIẾT NHÂN VIÊN (STAFF PROFILE)
-- ==========================================

CREATE TABLE staff_profiles (
    staff_id BIGINT PRIMARY KEY,
    employee_code VARCHAR(50) NOT NULL UNIQUE, -- Mã nhân viên (dùng kiểm tra khi đăng ký)
    department VARCHAR(100),                  -- Phòng ban (VD: Khách hàng cá nhân, Tra soát, CSKH)
    position VARCHAR(100),                    -- Chức danh (VD: Giao dịch viên, Chuyên viên tư vấn)
    date_of_birth DATE,
    address TEXT,
    FOREIGN KEY (staff_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ==========================================
-- B. QUẢN LÝ & TƯ VẤN KHÁCH HÀNG (CRM)
-- ==========================================

CREATE TABLE customer_advisories (
    advisory_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    staff_id BIGINT NOT NULL,                  -- Nhân viên thực hiện tư vấn
    product_type VARCHAR(100) NOT NULL,        -- Loại sản phẩm/dịch vụ (Gửi tiết kiệm, Thẻ tín dụng, Vay...)
    notes TEXT NOT NULL,                       -- Ghi chú/Nội dung tư vấn
    status ENUM('CONSULTED', 'FOLLOW_UP', 'COMPLETED', 'CANCELLED') DEFAULT 'CONSULTED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (staff_id) REFERENCES users(user_id)
);

-- ==========================================
-- C. HỖ TRỢ & CHĂM SÓC KHÁCH HÀNG (CSKH)
-- ==========================================

CREATE TABLE support_tickets (
    ticket_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_code VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    assigned_staff_id BIGINT NULL,             -- Nhân viên được phân công xử lý
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
    status ENUM('NEW', 'IN_PROGRESS', 'TRANSFERRED', 'RESOLVED', 'CLOSED') DEFAULT 'NEW',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (assigned_staff_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE support_ticket_logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    staff_id BIGINT NOT NULL,
    action_note TEXT NOT NULL,                 -- Nội dung giải đáp hoặc lý do chuyển bộ phận
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES users(user_id)
);

-- ==========================================
-- D. XỬ LÝ YÊU CẦU TRA SOÁT (DISPUTE / CHARGEBACK)
-- ==========================================

CREATE TABLE dispute_requests (
    dispute_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dispute_code VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    transaction_code VARCHAR(100) NOT NULL,   -- Mã giao dịch cần tra soát
    reason TEXT NOT NULL,                     -- Lý do tra soát
    status ENUM('PENDING', 'PROCESSING', 'APPROVED_REFUND', 'REJECTED', 'CLOSED') DEFAULT 'PENDING',
    handler_staff_id BIGINT NULL,             -- Nhân viên tiếp nhận/xử lý
    resolution_note TEXT NULL,                -- Kết quả xử lý tra soát
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (handler_staff_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ==========================================
-- E. XỬ LÝ GIAO DỊCH TÀI CHÍNH
-- ==========================================

CREATE TABLE financial_transactions (
    transaction_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_code VARCHAR(50) NOT NULL UNIQUE,
    sender_customer_id BIGINT NULL,           -- Khách hàng chuyển/nạp
    receiver_account_number VARCHAR(50) NOT NULL, -- Tài khoản thụ hưởng
    receiver_name VARCHAR(100) NOT NULL,      -- Tên người thụ hưởng
    bank_name VARCHAR(100) DEFAULT 'INTERNAL',-- Ngân hàng nhận (Nội bộ / Liên ngân hàng)
    amount DECIMAL(18, 2) NOT NULL,
    fee DECIMAL(18, 2) DEFAULT 0.00,
    description TEXT,
    processed_by_staff_id BIGINT NOT NULL,    -- Nhân viên thực hiện/xác nhận giao dịch
    status ENUM('SUCCESS', 'FAILED', 'PENDING_APPROVAL') DEFAULT 'SUCCESS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (processed_by_staff_id) REFERENCES users(user_id)
);

USE admin_portal_db;

-- 1. Quyền & Vai trò Nhân viên
INSERT INTO roles (role_id, role_code, role_name, description) VALUES
(3, 'ROLE_STAFF', 'Nhân viên nghiệp vụ', 'Thực hiện tư vấn, tra soát, hỗ trợ và giao dịch tài chính');

INSERT INTO permissions (permission_id, permission_code, permission_name, module_name) VALUES
(6, 'STAFF_CUSTOMER_ADVISORY', 'Tư vấn và quản lý khách hàng', 'StaffModule'),
(7, 'STAFF_SUPPORT_TICKET', 'Tiếp nhận và hỗ trợ CSKH', 'StaffModule'),
(8, 'STAFF_DISPUTE_HANDLE', 'Xử lý yêu cầu tra soát', 'StaffModule'),
(9, 'STAFF_FINANCIAL_TX', 'Thực hiện giao dịch tài chính', 'StaffModule');

INSERT INTO role_permissions (role_id, permission_id) VALUES
(3, 6), (3, 7), (3, 8), (3, 9);

-- 2. Tạo tài khoản Nhân viên mới (Test Đăng ký/Đăng nhập)
INSERT INTO users (user_id, username, password_hash, email, full_name, phone_number, status) VALUES
(103, 'nv_hoangnam', '$2a$12$eImiTXuWVxfM37uY4JANjOL.8/OHq8pM.a3T28eGv6g3u1r999999', 'nam.nv@bank.com', 'Nguyễn Hoàng Nam', '0933444555', 'ACTIVE');

INSERT INTO user_roles (user_id, role_id) VALUES
(103, 3);

INSERT INTO staff_profiles (staff_id, employee_code, department, position) VALUES
(103, 'NV-2026-089', 'Dịch vụ Khách hàng', 'Chuyên viên Quản lý & Tư vấn');

-- 3. Mẫu dữ liệu Xử lý Yêu cầu Tra soát
INSERT INTO dispute_requests (dispute_id, dispute_code, customer_id, transaction_code, reason, status, handler_staff_id, resolution_note) VALUES
(2001, 'TS-2026-001', 501, 'FT2608240012', 'Chuyển tiền tài khoản bị trừ nhưng người nhận chưa nhận được', 'PROCESSING', 103, 'Đã kiểm tra Core Banking, đang tra soát liên ngân hàng');

-- 4. Mẫu dữ liệu Tư vấn Khách hàng
INSERT INTO customer_advisories (customer_id, staff_id, product_type, notes, status) VALUES
(501, 103, 'Tiết kiệm Online 12 tháng', 'Khách hàng quan tâm lãi suất 6.8%, hẹn nộp tiền tuần sau', 'FOLLOW_UP');

-- 5. Mẫu dữ liệu Hỗ trợ & CSKH
INSERT INTO support_tickets (ticket_id, ticket_code, customer_id, assigned_staff_id, title, content, status) VALUES
(3001, 'TK-2026-005', 502, 103, 'Quên mật khẩu Mobile Banking', 'Khách hàng yêu cầu cấp lại mật khẩu ứng dụng điện thoại', 'RESOLVED');

INSERT INTO support_ticket_logs (ticket_id, staff_id, action_note) VALUES
(3001, 103, 'Đã xác minh CMND/CCCD qua điện thoại và gửi OTP reset mật khẩu cho khách hàng.');

-- 6. Mẫu dữ liệu Xử lý Giao dịch Tài chính
INSERT INTO financial_transactions (transaction_code, sender_customer_id, receiver_account_number, receiver_name, amount, fee, description, processed_by_staff_id, status) VALUES
(10001, 'TXN-2026-082401', 501, '1903888999', 'Trần Văn B', 15000000.00, 0.00, 'Chuyển tiền thanh toán hợp đồng', 103, 'SUCCESS');

INSERT INTO financial_transactions 
(transaction_code, sender_customer_id, receiver_account_number, receiver_name, amount, fee, description, processed_by_staff_id, status) 
VALUES 
('TXN-2026-082401', 501, '1903888999', 'Trần Văn B', 15000000.00, 0.00, 'Chuyển tiền thanh toán hợp đồng', 103, 'SUCCESS');




-- ====================================================================== KHACH HÀNG ========================================================


USE admin_portal_db;

-- ==========================================
-- 1. MỞ RỘNG LOẠI KHÁCH HÀNG (CÁ NHÂN & DOANH NGHIỆP)
-- ==========================================

-- Bổ sung loại khách hàng cho bảng customers sẵn có
ALTER TABLE customers 
ADD COLUMN customer_type ENUM('INDIVIDUAL', 'ENTERPRISE') DEFAULT 'INDIVIDUAL' AFTER full_name;

-- Bảng thông tin chi tiết cho Khách hàng Cá nhân (Thu nhập, Hợp đồng LĐ...)
CREATE TABLE individual_customers (
    customer_id BIGINT PRIMARY KEY,
    date_of_birth DATE,
    gender ENUM('MALE', 'FEMALE', 'OTHER'),
    monthly_income DECIMAL(18, 2) NULL,        -- Thu nhập hàng tháng (Dùng cho vay tiêu dùng)
    company_name VARCHAR(255) NULL,            -- Nơi công tác
    position VARCHAR(100) NULL,                -- Chức vụ
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

-- Bảng thông tin chi tiết cho Khách hàng Doanh nghiệp
CREATE TABLE enterprise_customers (
    customer_id BIGINT PRIMARY KEY,
    tax_code VARCHAR(50) NOT NULL UNIQUE,       -- Mã số thuế
    company_name VARCHAR(255) NOT NULL,         -- Tên doanh nghiệp
    representative_name VARCHAR(100) NOT NULL,  -- Người đại diện pháp luật
    business_license_number VARCHAR(100),       -- Giấy phép đăng ký kinh doanh
    charter_capital DECIMAL(18, 2) NULL,        -- Vốn điều lệ
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

-- ==========================================
-- 2. CHI TIẾT HỒ SƠ VAY (CONSUMER & AUTO LOAN)
-- ==========================================

-- Chi tiết Yêu cầu Vay (Tiêu dùng & Mua ô tô)
CREATE TABLE loan_applications (
    loan_app_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_id BIGINT NOT NULL UNIQUE,      -- Liên kết với bảng applications tổng
    loan_purpose ENUM('CONSUMER', 'AUTO', 'BUSINESS') NOT NULL, -- Mục đích vay
    loan_amount DECIMAL(18, 2) NOT NULL,        -- Số tiền cần vay
    loan_term_months INT NOT NULL,              -- Thời hạn vay (tháng)
    interest_rate_percentage DECIMAL(5, 2) NULL,-- Lãi suất áp dụng
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE
);

-- Thông tin Xe định mua (Dành cho Vay mua ô tô)
CREATE TABLE car_loan_details (
    car_detail_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    loan_app_id BIGINT NOT NULL UNIQUE,
    car_brand VARCHAR(100) NOT NULL,            -- Hãng xe (VD: Toyota, Honda)
    car_model VARCHAR(100) NOT NULL,            -- Mẫu xe (VD: Camry, CR-V)
    manufacture_year INT NOT NULL,              -- Năm sản xuất
    car_price DECIMAL(18, 2) NOT NULL,          -- Giá trị xe định mua
    is_new_car BOOLEAN DEFAULT TRUE,            -- Xe mới / Xe đã qua sử dụng
    FOREIGN KEY (loan_app_id) REFERENCES loan_applications(loan_app_id) ON DELETE CASCADE
);

-- Khai báo Tài sản đảm bảo (Collateral)
CREATE TABLE loan_collaterals (
    collateral_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    loan_app_id BIGINT NOT NULL,
    collateral_type ENUM('CAR', 'REAL_ESTATE', 'SAVING_BOOK', 'OTHER') NOT NULL, -- Loại TSĐB
    collateral_name VARCHAR(255) NOT NULL,       -- Tên/Mô tả tài sản
    estimated_value DECIMAL(18, 2) NOT NULL,     -- Giá trị định giá dự kiến
    document_proof_url VARCHAR(500) NULL,        -- File chứng minh sở hữu
    FOREIGN KEY (loan_app_id) REFERENCES loan_applications(loan_app_id) ON DELETE CASCADE
);

-- Lịch trả nợ dự kiến (Dùng cho chức năng "Xem lịch trả nợ dự kiến")
CREATE TABLE loan_schedules (
    schedule_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    loan_app_id BIGINT NOT NULL,
    period_number INT NOT NULL,                  -- Kỳ thứ (1, 2, 3...)
    due_date DATE NOT NULL,                      -- Ngày đến hạn
    principal_amount DECIMAL(18, 2) NOT NULL,    -- Gốc phải trả
    interest_amount DECIMAL(18, 2) NOT NULL,     -- Lãi phải trả
    total_payment DECIMAL(18, 2) NOT NULL,       -- Tổng cộng kỳ này
    FOREIGN KEY (loan_app_id) REFERENCES loan_applications(loan_app_id) ON DELETE CASCADE
);

USE admin_portal_db;

-- 1. Tạo Khách hàng Cá nhân & Khách hàng Doanh nghiệp
INSERT INTO customers (customer_id, full_name, customer_type, id_card_number, phone_number, email) VALUES
(601, 'Trần Thị Thu Hà', 'INDIVIDUAL', '001198004567', '0911222333', 'ha.tran@gmail.com'),
(602, 'Công ty TNHH Giải Pháp Công Nghệ ABC', 'ENTERPRISE', '0101234567', '0243999888', 'contact@abc-tech.vn');

INSERT INTO individual_customers (customer_id, date_of_birth, gender, monthly_income, company_name, position) VALUES
(601, '1998-05-15', 'FEMALE', 25000000.00, 'Công ty FPT Software', 'Kỹ sư phần mềm');

INSERT INTO enterprise_customers (customer_id, tax_code, company_name, representative_name, business_license_number, charter_capital) VALUES
(602, '0101234567', 'Công ty TNHH Giải Pháp Công Nghệ ABC', 'Nguyễn Văn Doanh', 'GPKD-2020-888', 5000000000.00);

-- 2. Hồ sơ Vay Tiêu Dùng (Khách hàng Cá nhân)
INSERT INTO applications (application_id, application_code, customer_id, application_type, requested_amount, status) VALUES
(2001, 'APP-CONSUMER-001', 601, 'LOAN', 100000000.00, 'PENDING');

INSERT INTO loan_applications (loan_app_id, application_id, loan_purpose, loan_amount, loan_term_months, interest_rate_percentage) VALUES
(3001, 2001, 'CONSUMER', 100000000.00, 24, 9.50);

INSERT INTO application_documents (application_id, gdocument_name, file_url) VALUES
(2001, 'Bang_luong_3_thang.pdf', '/uploads/loans/2001/bang_luong.pdf'),
(2001, 'Hop_dong_lao_dong.pdf', '/uploads/loans/2001/hdlv.pdf');

-- 3. Hồ sơ Vay Mua Ô tô (Khách hàng Cá nhân)
INSERT INTO applications (application_id, application_code, customer_id, application_type, requested_amount, status) VALUES
(2002, 'APP-AUTO-002', 601, 'LOAN', 500000000.00, 'PENDING');

INSERT INTO loan_applications (loan_app_id, application_id, loan_purpose, loan_amount, loan_term_months, interest_rate_percentage) VALUES
(3002, 2002, 'AUTO', 500000000.00, 60, 8.50);

INSERT INTO car_loan_details (loan_app_id, car_brand, car_model, manufacture_year, car_price, is_new_car) VALUES
(3002, 'Honda', 'CR-V L', 2026, 1100000000.00, TRUE);

INSERT INTO loan_collaterals (loan_app_id, collateral_type, collateral_name, estimated_value, document_proof_url) VALUES
(3002, 'CAR', 'Xe Ô tô Honda CR-V L 2026 (Chính chiếc xe mua)', 1100000000.00, '/uploads/loans/2002/car_quote.pdf');

-- Lịch trả nợ dự kiến kỳ 1 & kỳ 2
INSERT INTO loan_schedules (loan_app_id, period_number, due_date, principal_amount, interest_amount, total_payment) VALUES
(3002, 1, '2026-09-24', 8333333.33, 3541666.67, 11875000.00),
(3002, 2, '2026-10-24', 8333333.33, 3482638.89, 11815972.22);

INSERT INTO financial_transactions (transaction_code, sender_customer_id, receiver_account_number, receiver_name, amount, fee, description, processed_by_staff_id, status) 
VALUES ('TXN-2026-082401', 501, '1903888999', 'Trần Văn B', 15000000.00, 0.00, 'Chuyển tiền thanh toán hợp đồng', 103, 'SUCCESS');