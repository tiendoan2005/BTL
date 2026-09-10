CREATE DATABASE IF NOT EXISTS admin_portal_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE admin_portal_db;

-- ==========================================
-- 1. QUẢN LÝ HỆ THỐNG & PHÂN QUYỀN (RBAC)
-- ==========================================

CREATE TABLE IF NOT EXISTS roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_code VARCHAR(50) NOT NULL UNIQUE, -- VD: 'ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF'
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    permission_id INT AUTO_INCREMENT PRIMARY KEY,
    permission_code VARCHAR(100) NOT NULL UNIQUE, -- VD: 'POST_CREATE', 'STAFF_CUSTOMER_ADVISORY'
    permission_name VARCHAR(150) NOT NULL,
    module_name VARCHAR(50) NOT NULL, -- Phân loại module
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
    otp_secret VARCHAR(100) NULL, -- Dùng cho xác thực OTP
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

-- ==========================================
-- A. HỒ SƠ CHI TIẾT NHÂN VIÊN (STAFF PROFILE)
-- ==========================================

CREATE TABLE IF NOT EXISTS staff_profiles (
    staff_id BIGINT PRIMARY KEY,
    employee_code VARCHAR(50) NOT NULL UNIQUE, -- Mã nhân viên (dùng kiểm tra khi đăng ký)
    department VARCHAR(100),                  -- Phòng ban (VD: Khách hàng cá nhân, Tra soát, CSKH)
    position VARCHAR(100),                    -- Chức danh (VD: Giao dịch viên, Chuyên viên tư vấn)
    date_of_birth DATE,
    address TEXT,
    FOREIGN KEY (staff_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ==========================================
-- 2. AUDIT LOG (GHI VẾT HỆ THỐNG)
-- ==========================================

CREATE TABLE IF NOT EXISTS audit_logs (
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

CREATE TABLE IF NOT EXISTS exchange_rates (
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

CREATE TABLE IF NOT EXISTS gold_rates (
    gold_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    gold_type VARCHAR(50) NOT NULL, -- SJC, 24K, 18K
    buy_price DECIMAL(18, 2) NOT NULL,
    sell_price DECIMAL(18, 2) NOT NULL,
    effective_date DATE NOT NULL,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS interest_rates (
    rate_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_code VARCHAR(50) NOT NULL, -- 'SAVING_3M', 'LOAN_MORTGAGE'
    term_months INT NOT NULL, -- Kỳ hạn (tháng)
    rate_percentage DECIMAL(5, 2) NOT NULL, -- % lãi suất
    effective_date DATE NOT NULL,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS fee_templates (
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
-- 4. KHÁCH HÀNG & MỞ RỘNG (INDIVIDUAL / ENTERPRISE)
-- ==========================================

CREATE TABLE IF NOT EXISTS customers (
    customer_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    customer_type ENUM('INDIVIDUAL', 'ENTERPRISE') DEFAULT 'INDIVIDUAL',
    id_card_number VARCHAR(20) NOT NULL UNIQUE,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS individual_customers (
    customer_id BIGINT PRIMARY KEY,
    date_of_birth DATE,
    gender ENUM('MALE', 'FEMALE', 'OTHER'),
    monthly_income DECIMAL(18, 2) NULL,        -- Thu nhập hàng tháng
    company_name VARCHAR(255) NULL,            -- Nơi công tác
    position VARCHAR(100) NULL,                -- Chức vụ
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS enterprise_customers (
    customer_id BIGINT PRIMARY KEY,
    tax_code VARCHAR(50) NOT NULL UNIQUE,       -- Mã số thuế
    company_name VARCHAR(255) NOT NULL,         -- Tên doanh nghiệp
    representative_name VARCHAR(100) NOT NULL,  -- Người đại diện pháp luật
    business_license_number VARCHAR(100),       -- Giấy phép đăng ký kinh doanh
    charter_capital DECIMAL(18, 2) NULL,        -- Vốn điều lệ
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

-- ==========================================
-- 5. PHÊ DUYỆT HỒ SƠ & CHI TIẾT VAY (LOAN DETAILS)
-- ==========================================

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

CREATE TABLE IF NOT EXISTS loan_applications (
    loan_app_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_id BIGINT NOT NULL UNIQUE,      -- Liên kết với bảng applications tổng
    loan_purpose ENUM('CONSUMER', 'AUTO', 'BUSINESS') NOT NULL, -- Mục đích vay
    loan_amount DECIMAL(18, 2) NOT NULL,        -- Số tiền cần vay
    loan_term_months INT NOT NULL,              -- Thời hạn vay (tháng)
    interest_rate_percentage DECIMAL(5, 2) NULL,-- Lãi suất áp dụng
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS car_loan_details (
    car_detail_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    loan_app_id BIGINT NOT NULL UNIQUE,
    car_brand VARCHAR(100) NOT NULL,            -- Hãng xe (VD: Toyota, Honda)
    car_model VARCHAR(100) NOT NULL,            -- Mẫu xe (VD: Camry, CR-V)
    manufacture_year INT NOT NULL,              -- Năm sản xuất
    car_price DECIMAL(18, 2) NOT NULL,          -- Giá trị xe định mua
    is_new_car BOOLEAN DEFAULT TRUE,            -- Xe mới / Xe đã qua sử dụng
    FOREIGN KEY (loan_app_id) REFERENCES loan_applications(loan_app_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS loan_collaterals (
    collateral_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    loan_app_id BIGINT NOT NULL,
    collateral_type ENUM('CAR', 'REAL_ESTATE', 'SAVING_BOOK', 'OTHER') NOT NULL, -- Loại TSĐB
    collateral_name VARCHAR(255) NOT NULL,       -- Tên/Mô tả tài sản
    estimated_value DECIMAL(18, 2) NOT NULL,     -- Giá trị định giá dự kiến
    document_proof_url VARCHAR(500) NULL,        -- File chứng minh sở hữu
    FOREIGN KEY (loan_app_id) REFERENCES loan_applications(loan_app_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS loan_schedules (
    schedule_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    loan_app_id BIGINT NOT NULL,
    period_number INT NOT NULL,                  -- Kỳ thứ (1, 2, 3...)
    due_date DATE NOT NULL,                      -- Ngày đến hạn
    principal_amount DECIMAL(18, 2) NOT NULL,    -- Gốc phải trả
    interest_amount DECIMAL(18, 2) NOT NULL,     -- Lãi phải trả
    total_payment DECIMAL(18, 2) NOT NULL,       -- Tổng cộng kỳ này
    FOREIGN KEY (loan_app_id) REFERENCES loan_applications(loan_app_id) ON DELETE CASCADE
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
    reason_note TEXT NULL, -- Lý do từ chối hoặc yêu cầu bổ sung
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(application_id),
    FOREIGN KEY (manager_id) REFERENCES users(user_id)
);

-- ==========================================
-- B. QUẢN LÝ & TƯ VẤN KHÁCH HÀNG (CRM)
-- ==========================================

CREATE TABLE IF NOT EXISTS customer_advisories (
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

CREATE TABLE IF NOT EXISTS support_tickets (
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

CREATE TABLE IF NOT EXISTS support_ticket_logs (
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

CREATE TABLE IF NOT EXISTS dispute_requests (
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

CREATE TABLE IF NOT EXISTS financial_transactions (
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

-- ==========================================
-- 6. QUẢN TRỊ NỘI DUNG WEB (CMS)
-- ==========================================

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

-- ==========================================
-- 7. BÁO CÁO & THỐNG KÊ (EXPORT LOGS)
-- ==========================================

CREATE TABLE IF NOT EXISTS report_exports (
    export_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    report_type VARCHAR(100) NOT NULL, -- 'EXCHANGE_RATE_REPORT', 'LOAN_SUMMARY'
    filter_params JSON NOT NULL, -- Lưu bộ lọc: {"from_date": "2026-01-01", "to_date": "2026-08-24"}
    file_format ENUM('EXCEL', 'PDF', 'CSV') NOT NULL,
    file_path VARCHAR(500) NULL,
    exported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ==========================================
-- 8. QUẢN LÝ LỊCH HẸN CHATBOT (APPOINTMENTS)
-- ==========================================

CREATE TABLE IF NOT EXISTS chatbot_appointments (
    appointment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_code VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(100) NULL,
    branch_name VARCHAR(150) NOT NULL,
    service_type VARCHAR(150) NOT NULL,
    appointment_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    note TEXT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    handled_by VARCHAR(100) NULL,
    handler_note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_appt_status (status),
    INDEX idx_appt_phone (phone_number),
    INDEX idx_appt_date (appointment_date)
);
