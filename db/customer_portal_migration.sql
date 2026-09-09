-- =========================================================================
-- MIGRATION SCRIPT: HỖ TRỢ ĐĂNG NHẬP & BẢO MẬT CHO KHÁCH HÀNG (CUSTOMER PORTAL)
-- =========================================================================
USE admin_portal_db;

-- 1. Bổ sung các cột username, password_hash, status vào bảng customers
ALTER TABLE customers
    ADD COLUMN username VARCHAR(50) NULL UNIQUE AFTER full_name,
    ADD COLUMN password_hash VARCHAR(255) NULL AFTER username,
    ADD COLUMN status ENUM('ACTIVE', 'LOCKED', 'INACTIVE') DEFAULT 'ACTIVE' AFTER email;

-- 2. Cập nhật tài khoản đăng nhập mẫu cho Khách hàng cá nhân & Doanh nghiệp
UPDATE customers
SET username = 'kh_namle',
    password_hash = '$2a$12$eImiTXuWVxfM37uY4JANjOL.8/OHq8pM.a3T28eGv6g3u1r123456',
    status = 'ACTIVE'
WHERE customer_id = 501;

UPDATE customers
SET username = 'kh_minhanh',
    password_hash = '$2a$12$eImiTXuWVxfM37uY4JANjOL.8/OHq8pM.a3T28eGv6g3u1r123456',
    status = 'ACTIVE'
WHERE customer_id = 502;

UPDATE customers
SET username = 'kh_thuha',
    password_hash = '$2a$12$eImiTXuWVxfM37uY4JANjOL.8/OHq8pM.a3T28eGv6g3u1r123456',
    status = 'ACTIVE'
WHERE customer_id = 601;

UPDATE customers
SET username = 'dn_abctech',
    password_hash = '$2a$12$eImiTXuWVxfM37uY4JANjOL.8/OHq8pM.a3T28eGv6g3u1r123456',
    status = 'ACTIVE'
WHERE customer_id = 602;

-- 3. Tạo bảng yêu cầu Tiết kiệm Online (customer_savings)
CREATE TABLE IF NOT EXISTS customer_savings (
    saving_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    saving_code VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    product_code VARCHAR(50) NOT NULL,            -- SAVING_ONLINE_3M, SAVING_ONLINE_12M...
    deposit_amount DECIMAL(18, 2) NOT NULL,       -- Số tiền gửi tiết kiệm
    term_months INT NOT NULL,                     -- Kỳ hạn gửi (tháng)
    interest_rate DECIMAL(5, 2) NOT NULL,         -- Lãi suất áp dụng (%/năm)
    expected_interest DECIMAL(18, 2) NOT NULL,    -- Tiền lãi dự kiến
    maturity_date DATE NOT NULL,                  -- Ngày đáo hạn
    status ENUM('ACTIVE', 'SETTLED', 'CANCELLED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- 4. Tạo bảng yêu cầu Tài trợ thương mại Doanh nghiệp (trade_finance_requests)
CREATE TABLE IF NOT EXISTS trade_finance_requests (
    request_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_code VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    service_type ENUM('LETTER_OF_CREDIT', 'BANK_GUARANTEE', 'IMPORT_EXPORT_FINANCE') NOT NULL, -- L/C, Bảo lãnh, Tài trợ XNK
    amount DECIMAL(18, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'VND',
    beneficiary_name VARCHAR(255) NOT NULL,       -- Đối tác thụ hưởng L/C / Bảo lãnh
    purpose TEXT NOT NULL,                        -- Mục đích bảo lãnh / phát hành L/C
    document_url VARCHAR(500) NULL,               -- Hợp đồng thương mại / Hồ sơ đính kèm
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);
