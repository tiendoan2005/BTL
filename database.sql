-- ========================================================================
-- NGÂN HÀNG THƯƠNG MẠI CỔ PHẦN NGOẠI THƯƠNG VIỆT NAM (VIETCOMBANK)
-- HỆ THỐNG QUẢN TRỊ TỔNG THỂ & DỊCH VỤ NGÂN HÀNG SỐ TOÀN DIỆN
-- Tệp khởi tạo Database toàn diện: Khung bảng (DDL) + Dữ liệu mẫu (DML)
-- Tương thích: MySQL 8.0+ / MySQL Workbench (Safe Updates Mode Compliant)
-- ========================================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;

CREATE DATABASE IF NOT EXISTS admin_portal_db
    DEFAULT CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE admin_portal_db;

-- ========================================================================
-- PHẦN 1: KHỞI TẠO KHUNG BẢNG TOÀN DIỆN (DDL)
-- ========================================================================

-- 1.1. Phân quyền RBAC & Người dùng nội bộ
CREATE TABLE IF NOT EXISTS roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_code VARCHAR(50) NOT NULL UNIQUE,
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    permission_id INT AUTO_INCREMENT PRIMARY KEY,
    permission_code VARCHAR(100) NOT NULL UNIQUE,
    permission_name VARCHAR(150) NOT NULL,
    module_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    status ENUM('ACTIVE', 'INACTIVE', 'LOCKED') DEFAULT 'ACTIVE',
    otp_secret VARCHAR(100) NULL,
    otp_expiry TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
);

-- 1.2. Nhật ký hệ thống (Audit Logs)
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    action_type VARCHAR(100) NOT NULL,
    module_name VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    status ENUM('SUCCESS', 'FAILED') NOT NULL,
    description TEXT,
    payload_before JSON NULL,
    payload_after JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user_action (user_id, action_type),
    INDEX idx_created_at (created_at)
);

-- 1.3. Bảng Dữ liệu biến động (Tỷ giá ngoại tệ, Vàng, Lãi suất, Biểu phí)
CREATE TABLE IF NOT EXISTS exchange_rates (
    rate_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    currency_code VARCHAR(10) NOT NULL,
    buy_rate DECIMAL(18, 4) NOT NULL,
    sell_rate DECIMAL(18, 4) NOT NULL,
    transfer_rate DECIMAL(18, 4) NOT NULL,
    effective_date DATE NOT NULL,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    UNIQUE KEY uniq_currency_date (currency_code, effective_date)
);

CREATE TABLE IF NOT EXISTS gold_rates (
    gold_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    gold_type VARCHAR(50) NOT NULL,
    buy_price DECIMAL(18, 2) NOT NULL,
    sell_price DECIMAL(18, 2) NOT NULL,
    effective_date DATE NOT NULL,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS interest_rates (
    rate_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_code VARCHAR(50) NOT NULL,
    term_months INT NOT NULL,
    rate_percentage DECIMAL(5, 2) NOT NULL,
    effective_date DATE NOT NULL,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS fee_templates (
    template_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- 1.4. Quản lý Khách hàng cá nhân & Doanh nghiệp (Customer Portal)
CREATE TABLE IF NOT EXISTS customers (
    customer_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    customer_type ENUM('INDIVIDUAL', 'ENTERPRISE') DEFAULT 'INDIVIDUAL',
    id_card_number VARCHAR(20) NOT NULL UNIQUE,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    status ENUM('ACTIVE', 'LOCKED', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS individual_customers (
    customer_id BIGINT PRIMARY KEY,
    date_of_birth DATE,
    gender ENUM('MALE', 'FEMALE', 'OTHER'),
    monthly_income DECIMAL(18, 2) NULL,
    company_name VARCHAR(255) NULL,
    position VARCHAR(100) NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS enterprise_customers (
    customer_id BIGINT PRIMARY KEY,
    tax_code VARCHAR(50) NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    representative_name VARCHAR(100) NOT NULL,
    business_license_number VARCHAR(100),
    charter_capital DECIMAL(18, 2) NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS customer_savings (
    saving_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    saving_code VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    product_code VARCHAR(50) NOT NULL,
    deposit_amount DECIMAL(18, 2) NOT NULL,
    term_months INT NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL,
    expected_interest DECIMAL(18, 2) NOT NULL,
    maturity_date DATE NOT NULL,
    status ENUM('ACTIVE', 'SETTLED', 'CANCELLED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE IF NOT EXISTS trade_finance_requests (
    request_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_code VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    service_type ENUM('LETTER_OF_CREDIT', 'BANK_GUARANTEE', 'IMPORT_EXPORT_FINANCE') NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'VND',
    beneficiary_name VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    document_url VARCHAR(500) NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- 1.5. Phân hệ Nghiệp vụ Nhân viên ngân hàng (Staff CRM, Hỗ trợ, Tra soát, Giao dịch)
CREATE TABLE IF NOT EXISTS staff_profiles (
    staff_id BIGINT PRIMARY KEY,
    employee_code VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(100),
    position VARCHAR(100),
    date_of_birth DATE,
    address TEXT,
    FOREIGN KEY (staff_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS customer_advisories (
    advisory_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    staff_id BIGINT NOT NULL,
    product_type VARCHAR(100) NOT NULL,
    notes TEXT NOT NULL,
    status ENUM('CONSULTED', 'FOLLOW_UP', 'COMPLETED', 'CANCELLED') DEFAULT 'CONSULTED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (staff_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS support_tickets (
    ticket_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_code VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    assigned_staff_id BIGINT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
    status ENUM('NEW', 'IN_PROGRESS', 'TRANSFERRED', 'RESOLVED', 'CLOSED') DEFAULT 'NEW',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (assigned_staff_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS support_ticket_logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    staff_id BIGINT NOT NULL,
    action_note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS dispute_requests (
    dispute_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dispute_code VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    transaction_code VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('PENDING', 'PROCESSING', 'APPROVED_REFUND', 'REJECTED', 'CLOSED') DEFAULT 'PENDING',
    handler_staff_id BIGINT NULL,
    resolution_note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (handler_staff_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS financial_transactions (
    transaction_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_code VARCHAR(50) NOT NULL UNIQUE,
    sender_customer_id BIGINT NULL,
    receiver_account_number VARCHAR(50) NOT NULL,
    receiver_name VARCHAR(100) NOT NULL,
    bank_name VARCHAR(100) DEFAULT 'INTERNAL',
    amount DECIMAL(18, 2) NOT NULL,
    fee DECIMAL(18, 2) DEFAULT 0.00,
    description TEXT,
    processed_by_staff_id BIGINT NOT NULL,
    status ENUM('SUCCESS', 'FAILED', 'PENDING_APPROVAL') DEFAULT 'SUCCESS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (processed_by_staff_id) REFERENCES users(user_id)
);

-- 1.6. Phê duyệt hồ sơ & Chi tiết các gói vay (Consumer, Auto, Collateral, Schedule)
CREATE TABLE IF NOT EXISTS applications (
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

CREATE TABLE IF NOT EXISTS application_documents (
    document_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_id BIGINT NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS application_approvals (
    approval_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_id BIGINT NOT NULL,
    manager_id BIGINT NOT NULL,
    action ENUM('APPROVED', 'REJECTED', 'REQUEST_DOCS') NOT NULL,
    reason_note TEXT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(application_id),
    FOREIGN KEY (manager_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS loan_applications (
    loan_app_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_id BIGINT NOT NULL UNIQUE,
    loan_purpose ENUM('CONSUMER', 'AUTO', 'BUSINESS') NOT NULL,
    loan_amount DECIMAL(18, 2) NOT NULL,
    loan_term_months INT NOT NULL,
    interest_rate_percentage DECIMAL(5, 2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS car_loan_details (
    car_detail_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    loan_app_id BIGINT NOT NULL UNIQUE,
    car_brand VARCHAR(100) NOT NULL,
    car_model VARCHAR(100) NOT NULL,
    manufacture_year INT NOT NULL,
    car_price DECIMAL(18, 2) NOT NULL,
    is_new_car BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (loan_app_id) REFERENCES loan_applications(loan_app_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS loan_collaterals (
    collateral_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    loan_app_id BIGINT NOT NULL,
    collateral_type ENUM('CAR', 'REAL_ESTATE', 'SAVING_BOOK', 'OTHER') NOT NULL,
    collateral_name VARCHAR(255) NOT NULL,
    estimated_value DECIMAL(18, 2) NOT NULL,
    document_proof_url VARCHAR(500) NULL,
    FOREIGN KEY (loan_app_id) REFERENCES loan_applications(loan_app_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS loan_schedules (
    schedule_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    loan_app_id BIGINT NOT NULL,
    period_number INT NOT NULL,
    due_date DATE NOT NULL,
    principal_amount DECIMAL(18, 2) NOT NULL,
    interest_amount DECIMAL(18, 2) NOT NULL,
    total_payment DECIMAL(18, 2) NOT NULL,
    FOREIGN KEY (loan_app_id) REFERENCES loan_applications(loan_app_id) ON DELETE CASCADE
);

-- 1.7. Quản lý Tin tức, Bài viết & File đính kèm (CMS)
CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS posts (
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

CREATE TABLE IF NOT EXISTS post_attachments (
    attachment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) DEFAULT 'IMAGE',
    file_size BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS portal_banners (
    banner_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    image_url VARCHAR(500) NOT NULL,
    target_url VARCHAR(500),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS report_exports (
    export_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    filter_params JSON NOT NULL,
    file_format ENUM('EXCEL', 'PDF', 'CSV') NOT NULL,
    file_path VARCHAR(500) NULL,
    exported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 1.8. Bảng phục vụ Chatbot (Chi nhánh, Lịch hẹn, Phản hồi, Kiến thức FAQ)
CREATE TABLE IF NOT EXISTS branches (
    branch_id INT AUTO_INCREMENT PRIMARY KEY,
    branch_name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    district VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    phone_number VARCHAR(50),
    working_hours VARCHAR(100) DEFAULT '08:00 - 17:00 (Thứ 2 - Thứ 6)'
);

CREATE TABLE IF NOT EXISTS appointments (
    appointment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_code VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    branch_id INT NULL,
    branch_name VARCHAR(150),
    service_type VARCHAR(100) NOT NULL,
    appointment_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    note TEXT,
    status ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS contact_messages (
    message_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('NEW', 'PROCESSING', 'RESOLVED') DEFAULT 'NEW',
    response_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chatbot_faqs (
    faq_id INT AUTO_INCREMENT PRIMARY KEY,
    category ENUM('APPOINTMENT', 'CONTACT', 'USER_GUIDE', 'RATES', 'LOAN_SERVICE', 'CARD_SERVICE') NOT NULL,
    keywords VARCHAR(255) NOT NULL,
    question VARCHAR(255) NOT NULL,
    answer TEXT NOT NULL,
    action_type VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================================
-- PHẦN 2: DỌN DẸP AN TOÀN TRÁNH LỖI SAFE UPDATE MODE
-- ========================================================================

-- Sử dụng WHERE role_id > 0 để hoàn toàn tránh lỗi Error 1175 của MySQL Workbench
DELETE FROM role_permissions WHERE role_id > 0;
DELETE FROM user_roles WHERE user_id > 0;

-- ========================================================================
-- PHẦN 3: NẠP DỮ LIỆU CHUẨN & PHÂN QUYỀN CHÍNH XÁC (DML)
-- ========================================================================

-- 3.1. Danh mục 9 quyền hệ thống
INSERT INTO permissions (permission_id, permission_code, permission_name, module_name) VALUES
(1, 'SYS_MANAGE_USERS', 'Tạo và phân quyền tài khoản', 'System'),
(2, 'DATA_UPDATE_RATES', 'Cập nhật tỷ giá & lãi suất', 'FluctuatingData'),
(3, 'APPROVE_LOAN', 'Phê duyệt hồ sơ vay & mở thẻ', 'Approval'),
(4, 'REPORT_EXPORT', 'Xem và xuất file báo cáo', 'Report'),
(5, 'CMS_MANAGE_POST', 'Thêm mới và sửa bài viết', 'CMS'),
(6, 'STAFF_CUSTOMER_ADVISORY', 'Tư vấn và quản lý khách hàng', 'StaffModule'),
(7, 'STAFF_SUPPORT_TICKET', 'Tiếp nhận và hỗ trợ CSKH', 'StaffModule'),
(8, 'STAFF_DISPUTE_HANDLE', 'Xử lý yêu cầu tra soát', 'StaffModule'),
(9, 'STAFF_FINANCIAL_TX', 'Thực hiện và phê duyệt giao dịch tài chính', 'StaffModule')
ON DUPLICATE KEY UPDATE permission_name = VALUES(permission_name), module_name = VALUES(module_name);

-- 3.2. Danh mục 3 vai trò
INSERT INTO roles (role_id, role_code, role_name, description) VALUES
(1, 'ROLE_ADMIN', 'Quản trị hệ thống', 'Có toàn bộ quyền trong hệ thống'),
(2, 'ROLE_MANAGER', 'Quản lý phê duyệt', 'Chỉ có chức năng Phê duyệt hồ sơ, giao dịch tài chính và Xem báo cáo thống kê'),
(3, 'ROLE_STAFF', 'Nhân viên nghiệp vụ', 'Thực hiện tư vấn, tra soát, hỗ trợ CSKH và giao dịch')
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name), description = VALUES(description);

-- 3.3. Phân bổ quyền chính xác tuyệt đối:
-- ROLE_ADMIN: Sở hữu cả 9 quyền (1 đến 9)
INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9);

-- ROLE_MANAGER: CHỈ CÓ ĐÚNG 3 QUYỀN (APPROVE_LOAN = 3, REPORT_EXPORT = 4, STAFF_FINANCIAL_TX = 9)
-- Tuyệt đối KHÔNG có quyền Quản trị tài khoản, Không sửa tỷ giá, Không đăng bài CMS!
INSERT INTO role_permissions (role_id, permission_id) VALUES
(2, 3), (2, 4), (2, 9);

-- ROLE_STAFF: Có 4 quyền nghiệp vụ (6, 7, 8, 9)
INSERT INTO role_permissions (role_id, permission_id) VALUES
(3, 6), (3, 7), (3, 8), (3, 9);

-- 3.4. Tài khoản nội bộ demo (Mật khẩu mã hóa BCrypt chuẩn)
-- admin_super : Admin@123
-- manager_dev : Manager@123
-- ql_minhtuan : Manager@123
-- nv_hoangnam : Staff@123
INSERT INTO users (user_id, username, password_hash, email, full_name, phone_number, status) VALUES
(101, 'admin_super', '$2a$10$7/Osl1W13n8O.lT2K9R39e/5N5kG7c.H76fHspbV7g/s5V9rY9j6G', 'admin@bank.com', 'Nguyễn Văn Admin', '0901234567', 'ACTIVE'),
(102, 'manager_dev', '$2a$10$7/Osl1W13n8O.lT2K9R39e/5N5kG7c.H76fHspbV7g/s5V9rY9j6G', 'manager@bank.com', 'Trần Thị Duyệt', '0912345678', 'ACTIVE'),
(103, 'ql_minhtuan', '$2a$10$7/Osl1W13n8O.lT2K9R39e/5N5kG7c.H76fHspbV7g/s5V9rY9j6G', 'tuan.ql@bank.com', 'Lê Minh Tuấn', '0918999888', 'ACTIVE'),
(104, 'nv_hoangnam', '$2a$10$7/Osl1W13n8O.lT2K9R39e/5N5kG7c.H76fHspbV7g/s5V9rY9j6G', 'nam.nv@bank.com', 'Nguyễn Hoàng Nam', '0933444555', 'ACTIVE')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), phone_number = VALUES(phone_number);

-- Gán vai trò cho user
INSERT INTO user_roles (user_id, role_id) VALUES
(101, 1), -- admin_super -> ROLE_ADMIN
(102, 2), -- manager_dev -> ROLE_MANAGER
(103, 2), -- ql_minhtuan -> ROLE_MANAGER
(104, 3); -- nv_hoangnam -> ROLE_STAFF

INSERT INTO staff_profiles (staff_id, employee_code, department, position) VALUES
(104, 'NV-2026-089', 'Dịch vụ Khách hàng', 'Chuyên viên Quản lý & Tư vấn')
ON DUPLICATE KEY UPDATE department = VALUES(department), position = VALUES(position);

-- 3.5. Dữ liệu Tỷ giá ngoại tệ, Vàng & Lãi suất
INSERT INTO exchange_rates (currency_code, buy_rate, sell_rate, transfer_rate, effective_date, created_by) VALUES
('USD', 25400.0000, 25800.0000, 25430.0000, '2026-09-09', 101),
('EUR', 27200.0000, 27950.0000, 27300.0000, '2026-09-09', 101),
('GBP', 32100.0000, 33400.0000, 32300.0000, '2026-09-09', 101),
('JPY', 162.5000, 172.0000, 164.2000, '2026-09-09', 101),
('SGD', 18900.0000, 19700.0000, 19100.0000, '2026-09-09', 101),
('AUD', 16500.0000, 17250.0000, 16700.0000, '2026-09-09', 101)
ON DUPLICATE KEY UPDATE buy_rate = VALUES(buy_rate), sell_rate = VALUES(sell_rate), transfer_rate = VALUES(transfer_rate);

INSERT INTO gold_rates (gold_id, gold_type, buy_price, sell_price, effective_date, created_by) VALUES
(1, 'Vàng miếng SJC 999.9', 84000000.00, 86000000.00, '2026-09-09', 101),
(2, 'Vàng nhẫn trơn 24K', 77000000.00, 78500000.00, '2026-09-09', 101)
ON DUPLICATE KEY UPDATE buy_price = VALUES(buy_price), sell_price = VALUES(sell_price);

INSERT INTO interest_rates (product_code, term_months, rate_percentage, effective_date, created_by) VALUES
('SAVING_ONLINE', 1, 3.20, '2026-09-01', 101),
('SAVING_ONLINE', 3, 3.80, '2026-09-01', 101),
('SAVING_ONLINE', 6, 5.20, '2026-09-01', 101),
('SAVING_ONLINE', 12, 6.80, '2026-09-01', 101),
('SAVING_ONLINE', 24, 7.00, '2026-09-01', 101),
('LOAN_CONSUMER', 12, 6.50, '2026-09-01', 101),
('LOAN_AUTO', 36, 6.00, '2026-09-01', 101),
('LOAN_MORTGAGE', 120, 8.50, '2026-09-01', 101)
ON DUPLICATE KEY UPDATE rate_percentage = VALUES(rate_percentage);

INSERT INTO fee_templates (template_id, title, file_path, file_type, is_active, created_by) VALUES
(1, 'Bảng biểu phí dịch vụ thẻ & tài khoản 2026', '/uploads/fees/bieu_phi_the_2026.xlsx', 'EXCEL', TRUE, 101)
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 3.6. Dữ liệu Khách hàng cá nhân & Doanh nghiệp
-- Mật khẩu đăng nhập portal: Customer@123 ($2a$10$7/Osl1W13n8O.lT2K9R39e/5N5kG7c.H76fHspbV7g/s5V9rY9j6G)
INSERT INTO customers (customer_id, full_name, username, password_hash, customer_type, id_card_number, phone_number, email, status) VALUES
(501, 'Lê Hoàng Nam', 'kh_namle', '$2a$10$7/Osl1W13n8O.lT2K9R39e/5N5kG7c.H76fHspbV7g/s5V9rY9j6G', 'INDIVIDUAL', '001098001234', '0988777666', 'nam.le@gmail.com', 'ACTIVE'),
(502, 'Phạm Minh Anh', 'kh_minhanh', '$2a$10$7/Osl1W13n8O.lT2K9R39e/5N5kG7c.H76fHspbV7g/s5V9rY9j6G', 'INDIVIDUAL', '001099005678', '0977111222', 'minhanh@gmail.com', 'ACTIVE'),
(601, 'Trần Thị Thu Hà', 'kh_thuha', '$2a$10$7/Osl1W13n8O.lT2K9R39e/5N5kG7c.H76fHspbV7g/s5V9rY9j6G', 'INDIVIDUAL', '001198004567', '0911222333', 'ha.tran@gmail.com', 'ACTIVE'),
(602, 'Công ty TNHH Giải Pháp Công Nghệ ABC', 'dn_abctech', '$2a$10$7/Osl1W13n8O.lT2K9R39e/5N5kG7c.H76fHspbV7g/s5V9rY9j6G', 'ENTERPRISE', '0101234567', '0243999888', 'contact@abc-tech.vn', 'ACTIVE')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), customer_type = VALUES(customer_type);

INSERT INTO individual_customers (customer_id, date_of_birth, gender, monthly_income, company_name, position) VALUES
(501, '1995-03-20', 'MALE', 35000000.00, 'Tập đoàn Viettel', 'Trưởng nhóm kỹ thuật'),
(502, '1996-08-12', 'FEMALE', 22000000.00, 'Ngân hàng VPBank', 'Chuyên viên QHKH'),
(601, '1998-05-15', 'FEMALE', 25000000.00, 'Công ty FPT Software', 'Kỹ sư phần mềm')
ON DUPLICATE KEY UPDATE monthly_income = VALUES(monthly_income);

INSERT INTO enterprise_customers (customer_id, tax_code, company_name, representative_name, business_license_number, charter_capital) VALUES
(602, '0101234567', 'Công ty TNHH Giải Pháp Công Nghệ ABC', 'Nguyễn Văn Doanh', 'GPKD-2020-888', 5000000000.00)
ON DUPLICATE KEY UPDATE representative_name = VALUES(representative_name);

INSERT INTO customer_savings (saving_id, saving_code, customer_id, product_code, deposit_amount, term_months, interest_rate, expected_interest, maturity_date, status) VALUES
(1, 'STK-ONLINE-001', 501, 'SAVING_ONLINE_12M', 200000000.00, 12, 6.80, 13600000.00, '2027-09-01', 'ACTIVE')
ON DUPLICATE KEY UPDATE deposit_amount = VALUES(deposit_amount);

INSERT INTO trade_finance_requests (request_id, request_code, customer_id, service_type, amount, currency, beneficiary_name, purpose, status) VALUES
(1, 'TF-2026-001', 602, 'LETTER_OF_CREDIT', 1500000000.00, 'VND', 'Samsung Electronics VN', 'Mở L/C nhập khẩu linh kiện điện tử viễn thông', 'PENDING')
ON DUPLICATE KEY UPDATE amount = VALUES(amount);

-- 3.7. Dữ liệu CRM & Nghiệp vụ nhân viên
INSERT INTO customer_advisories (advisory_id, customer_id, staff_id, product_type, notes, status) VALUES
(1, 501, 104, 'Gói vay mua nhà an cư 35 năm', 'Khách hàng có thu nhập ổn định 35tr/tháng, tư vấn gói vay 1.5 tỷ giải ngân theo tiến độ hợp đồng mua bán.', 'FOLLOW_UP'),
(2, 602, 104, 'Tín dụng doanh nghiệp & L/C', 'Doanh nghiệp xuất nhập khẩu linh kiện, nhu cầu bảo lãnh thanh toán 3 tỷ đồng.', 'COMPLETED')
ON DUPLICATE KEY UPDATE notes = VALUES(notes);

INSERT INTO support_tickets (ticket_id, ticket_code, customer_id, assigned_staff_id, title, content, priority, status) VALUES
(1, 'TCK-2026-001', 501, 104, 'Hỗ trợ nâng hạn mức thẻ tín dụng', 'Khách hàng có lịch sử tín dụng tốt, yêu cầu nâng hạn mức thẻ Platinum từ 50tr lên 100tr.', 'HIGH', 'IN_PROGRESS'),
(2, 'TCK-2026-002', 502, 104, 'Kích hoạt phương thức Smart OTP trên máy mới', 'Khách hàng đổi điện thoại iPhone 16 mới, cần xác thực kích hoạt lại Smart OTP qua eKYC.', 'MEDIUM', 'RESOLVED')
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO dispute_requests (dispute_id, dispute_code, customer_id, transaction_code, reason, status, handler_staff_id, resolution_note) VALUES
(1, 'DSP-2026-001', 502, 'TXN-99887766', 'Giao dịch rút tiền tại cây ATM Vietcombank Ba Đình bị trừ tiền nhưng máy không nhả tiền mặt do lỗi nhả thẻ.', 'PROCESSING', 104, 'Đã kiểm tra nhật ký quầy ATM, đang thực hiện hoàn tiền trong 24h.')
ON DUPLICATE KEY UPDATE reason = VALUES(reason);

INSERT INTO financial_transactions (transaction_id, transaction_code, sender_customer_id, receiver_account_number, receiver_name, bank_name, amount, fee, description, processed_by_staff_id, status) VALUES
(1, 'FTX-2026-001', 501, '0011004567890', 'Nguyễn Hoàng Long', 'INTERNAL', 25000000.00, 0.00, 'Thanh toán tiền đặt cọc thuê văn phòng tháng 9', 104, 'SUCCESS'),
(2, 'FTX-2026-002', 602, '0071009876543', 'Công ty CP Đầu Tư Xây Dựng Nam Á', 'INTERNAL', 120000000.00, 11000.00, 'Thanh toán đợt 2 theo hợp đồng thi công số 12/HĐ-NA', 104, 'SUCCESS')
ON DUPLICATE KEY UPDATE amount = VALUES(amount);

-- 3.8. Dữ liệu Phê duyệt hồ sơ vay & Chi tiết các gói vay
INSERT INTO applications (application_id, application_code, customer_id, application_type, requested_amount, status) VALUES
(1001, 'APP-2026-001', 501, 'LOAN', 500000000.00, 'APPROVED'),
(1002, 'APP-2026-002', 502, 'CARD_ISSUANCE', 50000000.00, 'DOCS_REQUIRED'),
(1003, 'APP-2026-003', 601, 'LOAN', 800000000.00, 'PENDING')
ON DUPLICATE KEY UPDATE requested_amount = VALUES(requested_amount);

INSERT INTO loan_applications (loan_app_id, application_id, loan_purpose, loan_amount, loan_term_months, interest_rate_percentage) VALUES
(1, 1001, 'CONSUMER', 500000000.00, 60, 6.50),
(2, 1003, 'AUTO', 800000000.00, 84, 6.00)
ON DUPLICATE KEY UPDATE loan_amount = VALUES(loan_amount);

INSERT INTO car_loan_details (car_detail_id, loan_app_id, car_brand, car_model, manufacture_year, car_price, is_new_car) VALUES
(1, 2, 'Toyota', 'Camry 2.5Q Hybrid', 2026, 1450000000.00, TRUE)
ON DUPLICATE KEY UPDATE car_price = VALUES(car_price);

INSERT INTO loan_collaterals (collateral_id, loan_app_id, collateral_type, collateral_name, estimated_value, document_proof_url) VALUES
(1, 2, 'CAR', 'Xe ô tô Toyota Camry 2.5Q 2026 biển số Hà Nội', 1450000000.00, '/uploads/collateral/dang_ky_xe_camry.pdf')
ON DUPLICATE KEY UPDATE estimated_value = VALUES(estimated_value);

INSERT INTO loan_schedules (schedule_id, loan_app_id, period_number, due_date, principal_amount, interest_amount, total_payment) VALUES
(1, 1, 1, '2026-10-01', 8333333.33, 2708333.33, 11041666.66),
(2, 1, 2, '2026-11-01', 8333333.33, 2663194.44, 10996527.77)
ON DUPLICATE KEY UPDATE total_payment = VALUES(total_payment);

INSERT INTO application_approvals (approval_id, application_id, manager_id, action, reason_note) VALUES
(1, 1001, 102, 'APPROVED', 'Hồ sơ pháp lý và năng lực tài chính đáp ứng tiêu chuẩn thẩm định tín dụng Vietcombank.')
ON DUPLICATE KEY UPDATE reason_note = VALUES(reason_note);

-- 3.9. Dữ liệu Tin tức, Bài viết CMS, File đính kèm & Banners
INSERT INTO categories (category_id, category_name, slug) VALUES
(1, 'Tin tức ngân hàng', 'tin-tuc-ngan-hang'),
(2, 'Ưu đãi thẻ', 'uu-dai-the'),
(3, 'Tín dụng & Lãi suất', 'tin-dung-lai-suat'),
(4, 'Chuyển đổi số', 'chuyen-doi-so')
ON DUPLICATE KEY UPDATE category_name = VALUES(category_name);

INSERT INTO posts (post_id, title, slug, summary, content, thumbnail_url, category_id, author_id, status, published_at) VALUES
(1, 'Vietcombank triển khai gói tín dụng ưu đãi 100.000 tỷ đồng với lãi suất từ 6.0%/năm',
 'goi-tin-dung-uu-dai-100k-ty',
 'Gói vay quy mô lớn hỗ trợ khách hàng cá nhân và doanh nghiệp tiếp cận nguồn vốn ưu đãi phục hồi sản xuất, kinh doanh và mua nhà an cư.',
 '<p>Vietcombank chính thức tung ra chương trình tín dụng quy mô 100.000 tỷ đồng với lãi suất cho vay cố định chỉ từ 6.0%/năm trong 12 tháng đầu hoặc 7.5%/năm trong 24 tháng đầu...</p>',
 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=600&auto=format&fit=crop&q=80',
 3, 101, 'PUBLISHED', '2026-09-08 08:30:00'),

(2, 'VCB Digibank thế hệ mới: Nâng tầm trải nghiệm với Trợ lý AI và Sinh trắc học',
 'vcb-digibank-the-he-moi-ai-sinh-trac-hoc',
 'Vietcombank chính thức cập nhật phiên bản VCB Digibank mới tích hợp bảo mật sinh trắc học khuôn mặt chuẩn Quyết định 2345/QĐ-NHNN.',
 '<p>Hệ thống ngân hàng số VCB Digibank bổ sung tính năng trợ lý ảo tài chính tự động phân loại chi tiêu và xác thực giao dịch giá trị cao qua nhận diện khuôn mặt bảo mật tuyệt đối...</p>',
 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80',
 4, 101, 'PUBLISHED', '2026-09-05 09:00:00'),

(3, 'Biểu lãi suất tiền gửi tiết kiệm Vietcombank mới nhất tháng 09/2026',
 'bieu-lai-suat-tiet-kiem-thang-09-2026',
 'Cập nhật bảng lãi suất huy động vốn tiền gửi VND và ngoại tệ tại quầy và trực tuyến trên ứng dụng VCB Digibank kỳ hạn từ 1 đến 60 tháng.',
 '<p>Lãi suất tiền gửi tiết kiệm online tại Vietcombank kỳ hạn 12 đến 24 tháng đạt mức hấp dẫn 6.8%/năm, cộng thêm 0.2%/năm đối với khách hàng gửi trên ứng dụng di động...</p>',
 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
 3, 101, 'PUBLISHED', '2026-09-01 10:15:00'),

(4, 'Chương trình thẻ Vietcombank Visa Signature: Hoàn tiền 15% ẩm thực và du lịch toàn cầu',
 'vcb-visa-signature-hoan-tien-15-phan-tram',
 'Đặc quyền thượng lưu dành riêng cho chủ thẻ tín dụng cao cấp: Miễn phí phòng chờ sân bay quốc tế hạng thương gia và tích điểm đổi dặm bay.',
 '<p>Chủ thẻ tín dụng Vietcombank Visa Signature được hưởng quyền lợi hoàn tiền lên tới 15% tại hàng nghìn nhà hàng khách sạn 5 sao cao cấp trên toàn cầu...</p>',
 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=600&auto=format&fit=crop&q=80',
 2, 101, 'PUBLISHED', '2026-08-28 14:20:00')
ON DUPLICATE KEY UPDATE title = VALUES(title), summary = VALUES(summary), thumbnail_url = VALUES(thumbnail_url);

INSERT INTO post_attachments (attachment_id, post_id, file_name, file_url, file_type) VALUES
(1, 1, 'Bieu_mau_vay_von_2026.pdf', '/uploads/posts/docs/bieu_mau_vay_2026.pdf', 'PDF'),
(2, 1, 'Banner_chuong_trinh_tin_dung.jpg', 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=800', 'IMAGE'),
(3, 2, 'Giao_dien_VCB_Digibank_AI.png', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800', 'IMAGE')
ON DUPLICATE KEY UPDATE file_name = VALUES(file_name);

INSERT INTO portal_banners (banner_id, title, subtitle, image_url, target_url, display_order) VALUES
(1, 'Chuyển đổi số cùng Vietcombank', 'Trải nghiệm hệ sinh thái Ngân hàng số bảo mật vượt trội', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200', '#/portal', 1),
(2, 'Gói vay mua nhà an cư lãi suất 6.0%', 'Hạn mức vay lên tới 85% giá trị bất động sản, thời hạn 35 năm', 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=1200', '#/portal', 2),
(3, 'Thẻ tín dụng Vietcombank Cashback', 'Hoàn tiền chi tiêu không giới hạn cho mọi giao dịch thanh toán', 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=1200', '#/portal', 3)
ON DUPLICATE KEY UPDATE title = VALUES(title), image_url = VALUES(image_url);

-- 3.10. Dữ liệu Chatbot & Chi nhánh giao dịch
INSERT INTO branches (branch_id, branch_name, address, district, city, phone_number) VALUES
(1, 'Chi nhánh Vietcombank Hoàn Kiếm', '198 Trần Quang Khải', 'Quận Hoàn Kiếm', 'Hà Nội', '024 3934 3137'),
(2, 'Chi nhánh Vietcombank Ba Đình', '521 Kim Mã', 'Quận Ba Đình', 'Hà Nội', '024 3726 1234'),
(3, 'Chi nhánh Vietcombank TP.HCM - Hội sở Bến Thành', 'Tòa nhà Vietcombank Tower, Công trường Mê Linh', 'Quận 1', 'TP. Hồ Chí Minh', '028 3829 7245'),
(4, 'Chi nhánh Vietcombank Bến Thành', '69 Bùi Thị Xuân', 'Quận 1', 'TP. Hồ Chí Minh', '028 3833 0888'),
(5, 'Chi nhánh Vietcombank Đà Nẵng', '140-142 Lê Lợi', 'Quận Hải Châu', 'Đà Nẵng', '0236 382 2110'),
(6, 'Chi nhánh Vietcombank Cần Thơ', '3-5-7 Hòa Bình', 'Quận Ninh Kiều', 'Cần Thơ', '0292 382 0422')
ON DUPLICATE KEY UPDATE address = VALUES(address);

INSERT INTO chatbot_faqs (faq_id, category, keywords, question, answer, action_type) VALUES
(1, 'CONTACT', 'hotline, tổng đài, số điện thoại, cskh, liên hệ',
 'Tổng đài Hotline hỗ trợ khách hàng Vietcombank là số nào?',
 'Trung tâm Hỗ trợ Khách hàng Vietcombank phục vụ 24/7:\n📞 Hotline trong nước: 1900 54 54 13\n📞 Hotline quốc tế: (+84) 243 8243524\n✉️ Email: contact@vietcombank.com.vn',
 'OPEN_TAB_CONTACT'),

(2, 'APPOINTMENT', 'đặt lịch, hẹn quầy, chi nhánh, lấy số thứ tự',
 'Làm thế nào để đặt lịch hẹn giao dịch trước tại quầy Vietcombank?',
 'Quý khách có thể chọn tab "📅 Đặt lịch hẹn" ngay trong Chatbot hoặc trên cổng thông tin để chọn chi nhánh, khung giờ và dịch vụ cần giao dịch. Quý khách sẽ được tiếp đón tại quầy ưu tiên mà không cần bốc số chờ đợi.',
 'OPEN_TAB_APPOINTMENT'),

(3, 'USER_GUIDE', 'quên mật khẩu, khóa tài khoản, digibank',
 'Tôi quên mật khẩu đăng nhập ứng dụng VCB Digibank thì phải làm sao?',
 'Tại màn hình đăng nhập VCB Digibank, Quý khách bấm "Quên mật khẩu" → Nhập Tên đăng nhập, số CCCD và Email đã đăng ký → Hệ thống xác thực bằng khuôn mặt eKYC và gửi mật khẩu tạm thời về SMS/Email của quý khách trong 1 phút.',
 'USER_GUIDE'),

(4, 'USER_GUIDE', 'mở tài khoản, đăng ký mới, ekyc',
 'Làm thế nào để mở tài khoản Vietcombank online tại nhà?',
 'Quý khách tải ứng dụng VCB Digibank trên App Store hoặc Google Play → Chọn "Mở tài khoản mới" → Chụp ảnh 2 mặt CCCD gắn chip → Xác thực khuôn mặt sinh trắc học và nhận số tài khoản đẹp kích hoạt ngay.',
 'USER_GUIDE'),

(5, 'RATES', 'lãi suất, gửi tiết kiệm, tiền gửi',
 'Mức lãi suất tiền gửi tiết kiệm cao nhất hiện nay tại Vietcombank là bao nhiêu?',
 'Mức lãi suất tiết kiệm trực tuyến tại Vietcombank hiện lên tới 6.8%/năm cho kỳ hạn 12 đến 24 tháng. Quý khách có thể sử dụng "Công cụ tính lãi" ngay trên trang chủ để xem trước số tiền lãi nhận được.',
 'OPEN_CALC'),

(6, 'LOAN_SERVICE', 'vay vốn, mua nhà, mua ô tô, lãi suất vay',
 'Chương trình cho vay mua nhà và mua xe ô tô của Vietcombank có ưu đãi gì?',
 'Vietcombank đang áp dụng gói tín dụng ưu đãi với lãi suất vay chỉ từ 6.0%/năm, tài trợ tới 85% giá trị tài sản đảm bảo, thời hạn vay lên đến 35 năm. Quý khách có thể bấm nút "Đăng ký nộp hồ sơ vay online" để được cán bộ tín dụng tư vấn trong 24h.',
 'OPEN_CALC')
ON DUPLICATE KEY UPDATE answer = VALUES(answer);

-- ========================================================================
-- PHẦN 4: KHÔI PHỤC CẤU HÌNH VÀ KIỂM TRA KẾT QUẢ
-- ========================================================================

SET SQL_SAFE_UPDATES = 1;
SET FOREIGN_KEY_CHECKS = 1;

-- Kiểm tra phân quyền chuẩn cho Quản lý phê duyệt (ROLE_MANAGER):
-- Kết quả PHẢI CHỈ CÓ 3 DÒNG: APPROVE_LOAN, REPORT_EXPORT, STAFF_FINANCIAL_TX
SELECT r.role_code, r.role_name, p.permission_code, p.permission_name
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.role_id
JOIN permissions p ON rp.permission_id = p.permission_id
WHERE r.role_code = 'ROLE_MANAGER';
