USE admin_portal_db;

-- ============================================================================
-- SCRIPT BỔ SUNG DỮ LIỆU MẪU HỆ THỐNG VIETCOMBANK DIGITAL BANKING & ADMIN
-- (Lưu ý: Không tạo thêm tài khoản cán bộ và khách hàng, chỉ thêm nghiệp vụ)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. BẢNG LỊCH HẸN CHATBOT & CỔNG ĐIỆN TỬ (chatbot_appointments)
-- ----------------------------------------------------------------------------
INSERT INTO chatbot_appointments
(appointment_code, full_name, phone_number, email, branch_name, service_type, appointment_date, time_slot, note, status, handled_by, handler_note)
VALUES
('VCB-APT-2026-20001', 'Nguyễn Thị Hồng Hạnh', '0915666777', 'hanh.nguyen@gmail.com', 'Chi nhánh Vietcombank Hoàn Kiếm - Hà Nội', 'Tư vấn hồ sơ vay vốn (Mua nhà/Mua xe/Kinh doanh)', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:30 - 10:30', 'Cần tư vấn gói vay mua chung cư Vinhomes Smart City 2 tỷ, vay 15 năm', 'PENDING', NULL, NULL),
('VCB-APT-2026-20002', 'Vũ Đình Trọng', '0982334455', 'trong.vu@outlook.com', 'Chi nhánh Vietcombank Bến Thành - TP.HCM', 'Gửi tiền tiết kiệm & Mở tài khoản', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:30 - 11:30', 'Gửi tiết kiệm bậc thang 500 triệu, cần tư vấn kỳ hạn sinh lời tốt nhất', 'CONFIRMED', 'Nguyễn Hoàng Nam', 'Đã gọi xác nhận lúc 09h sáng, đã giữ quầy ưu tiên số 02'),
('VCB-APT-2026-20003', 'Công ty CP Đầu tư & Công nghệ Sao Mai', '0243777888', 'tckt@saomai.vn', 'Chi nhánh Vietcombank Cầu Giấy', 'Dịch vụ Doanh nghiệp & Tài trợ thương mại', DATE_ADD(CURDATE(), INTERVAL 2 DAY), '14:30 - 15:30', 'Hồ sơ mở L/C nhập khẩu thiết bị máy móc từ Hàn Quốc giá trị 350,000 USD', 'PENDING', NULL, NULL),
('VCB-APT-2026-20004', 'Hoàng Minh Đức', '0903112244', 'duc.hoang@fpt.com.vn', 'Chi nhánh Vietcombank Ba Đình - Hà Nội', 'Phát hành thẻ tín dụng quốc tế', CURDATE(), '08:30 - 09:30', 'Muốn phát hành thẻ Vietcombank Visa Signature hoàn tiền mua sắm', 'COMPLETED', 'Nguyễn Hoàng Nam', 'Đã hoàn tất tiếp nhận hồ sơ, phát hành thẻ hạn mức 150 triệu VND'),
('VCB-APT-2026-20005', 'Đặng Thùy Dung', '0979445566', 'dung.dang@yahoo.com', 'Chi nhánh Vietcombank TP.HCM - Q.1', 'Tra soát giao dịch & Hỗ trợ ngân hàng số', DATE_ADD(CURDATE(), INTERVAL -1 DAY), '13:30 - 14:30', 'Quên mã PIN Smart OTP và thẻ ghi nợ quốc tế bị khóa', 'COMPLETED', 'Nguyễn Hoàng Nam', 'Đã kích hoạt lại Smart OTP và cấp lại PIN thẻ tại quầy'),
('VCB-APT-2026-20006', 'Phan Văn Hậu', '0938999111', 'hau.phan@gmail.com', 'Chi nhánh Vietcombank Đà Nẵng', 'Giao dịch nộp / rút tiền mặt số lượng lớn', DATE_ADD(CURDATE(), INTERVAL 2 DAY), '09:00 - 10:00', 'Rút tiền mặt 800 triệu chuẩn bị thanh toán tiền cọc mua đất', 'CONFIRMED', 'Nguyễn Hoàng Nam', 'Đã báo kho quỹ chi nhánh chuẩn bị sẵn tiền mặt'),
('VCB-APT-2026-20007', 'Lê Khánh Huyền', '0912888333', 'huyen.le@vnpay.vn', 'Chi nhánh Vietcombank Hoàn Kiếm - Hà Nội', 'Mở tài khoản thanh toán số đẹp & Thẻ Visa', DATE_ADD(CURDATE(), INTERVAL 3 DAY), '15:30 - 16:30', 'Chọn tài khoản số đẹp lộc phát đuôi 6868', 'PENDING', NULL, NULL),
('VCB-APT-2026-20008', 'Ngô Quốc Bảo', '0908777888', 'bao.ngo@vinamilk.com.vn', 'Chi nhánh Vietcombank Cần Thơ', 'Tư vấn hồ sơ vay vốn (Mua nhà/Mua xe/Kinh doanh)', DATE_ADD(CURDATE(), INTERVAL -2 DAY), '10:00 - 11:00', 'Vay mua xe ô tô tải phục vụ kinh doanh trang trại', 'CANCELLED', 'Nguyễn Hoàng Nam', 'Khách hàng đổi kế hoạch sang tháng sau, đã hủy lịch hẹn theo yêu cầu')
ON DUPLICATE KEY UPDATE note=VALUES(note);

-- ----------------------------------------------------------------------------
-- 2. TỶ GIÁ NGOẠI TỆ ĐA DẠNG (exchange_rates)
-- ----------------------------------------------------------------------------
INSERT INTO exchange_rates (currency_code, buy_rate, sell_rate, transfer_rate, effective_date, created_by)
SELECT 'USD', 25380.0000, 25770.0000, 25410.0000, CURDATE(), u.user_id FROM users u WHERE u.username = 'admin_super' LIMIT 1
ON DUPLICATE KEY UPDATE buy_rate=VALUES(buy_rate), sell_rate=VALUES(sell_rate);

INSERT INTO exchange_rates (currency_code, buy_rate, sell_rate, transfer_rate, effective_date, created_by)
SELECT 'EUR', 27450.0000, 28980.0000, 27720.0000, CURDATE(), u.user_id FROM users u WHERE u.username = 'admin_super' LIMIT 1
ON DUPLICATE KEY UPDATE buy_rate=VALUES(buy_rate), sell_rate=VALUES(sell_rate);

INSERT INTO exchange_rates (currency_code, buy_rate, sell_rate, transfer_rate, effective_date, created_by)
SELECT 'GBP', 32560.0000, 33950.0000, 32890.0000, CURDATE(), u.user_id FROM users u WHERE u.username = 'admin_super' LIMIT 1
ON DUPLICATE KEY UPDATE buy_rate=VALUES(buy_rate), sell_rate=VALUES(sell_rate);

INSERT INTO exchange_rates (currency_code, buy_rate, sell_rate, transfer_rate, effective_date, created_by)
SELECT 'JPY', 168.5000, 178.2000, 170.2000, CURDATE(), u.user_id FROM users u WHERE u.username = 'admin_super' LIMIT 1
ON DUPLICATE KEY UPDATE buy_rate=VALUES(buy_rate), sell_rate=VALUES(sell_rate);

INSERT INTO exchange_rates (currency_code, buy_rate, sell_rate, transfer_rate, effective_date, created_by)
SELECT 'AUD', 16580.0000, 17290.0000, 16750.0000, CURDATE(), u.user_id FROM users u WHERE u.username = 'admin_super' LIMIT 1
ON DUPLICATE KEY UPDATE buy_rate=VALUES(buy_rate), sell_rate=VALUES(sell_rate);

INSERT INTO exchange_rates (currency_code, buy_rate, sell_rate, transfer_rate, effective_date, created_by)
SELECT 'SGD', 19120.0000, 19940.0000, 19310.0000, CURDATE(), u.user_id FROM users u WHERE u.username = 'admin_super' LIMIT 1
ON DUPLICATE KEY UPDATE buy_rate=VALUES(buy_rate), sell_rate=VALUES(sell_rate);

INSERT INTO exchange_rates (currency_code, buy_rate, sell_rate, transfer_rate, effective_date, created_by)
SELECT 'CAD', 18350.0000, 19130.0000, 18540.0000, CURDATE(), u.user_id FROM users u WHERE u.username = 'admin_super' LIMIT 1
ON DUPLICATE KEY UPDATE buy_rate=VALUES(buy_rate), sell_rate=VALUES(sell_rate);

INSERT INTO exchange_rates (currency_code, buy_rate, sell_rate, transfer_rate, effective_date, created_by)
SELECT 'CHF', 29100.0000, 30340.0000, 29390.0000, CURDATE(), u.user_id FROM users u WHERE u.username = 'admin_super' LIMIT 1
ON DUPLICATE KEY UPDATE buy_rate=VALUES(buy_rate), sell_rate=VALUES(sell_rate);

INSERT INTO exchange_rates (currency_code, buy_rate, sell_rate, transfer_rate, effective_date, created_by)
SELECT 'CNY', 3510.0000, 3660.0000, 3545.0000, CURDATE(), u.user_id FROM users u WHERE u.username = 'admin_super' LIMIT 1
ON DUPLICATE KEY UPDATE buy_rate=VALUES(buy_rate), sell_rate=VALUES(sell_rate);

INSERT INTO exchange_rates (currency_code, buy_rate, sell_rate, transfer_rate, effective_date, created_by)
SELECT 'KRW', 18.2000, 20.1000, 18.9000, CURDATE(), u.user_id FROM users u WHERE u.username = 'admin_super' LIMIT 1
ON DUPLICATE KEY UPDATE buy_rate=VALUES(buy_rate), sell_rate=VALUES(sell_rate);

-- ----------------------------------------------------------------------------
-- 3. GIÁ VÀNG TRỰC TUYẾN (gold_rates)
-- ----------------------------------------------------------------------------
INSERT INTO gold_rates (gold_type, buy_price, sell_price, effective_date, created_by)
SELECT 'Vàng miếng SJC', 84500000.00, 86500000.00, CURDATE(), u.user_id FROM users u WHERE u.username = 'admin_super' LIMIT 1;

INSERT INTO gold_rates (gold_type, buy_price, sell_price, effective_date, created_by)
SELECT 'Nhẫn trơn VCB 99.99%', 77800000.00, 79100000.00, CURDATE(), u.user_id FROM users u WHERE u.username = 'admin_super' LIMIT 1;

INSERT INTO gold_rates (gold_type, buy_price, sell_price, effective_date, created_by)
SELECT 'Vàng nữ trang 24K', 76500000.00, 78000000.00, CURDATE(), u.user_id FROM users u WHERE u.username = 'admin_super' LIMIT 1;

INSERT INTO gold_rates (gold_type, buy_price, sell_price, effective_date, created_by)
SELECT 'Vàng nữ trang 18K (75%)', 56800000.00, 59200000.00, CURDATE(), u.user_id FROM users u WHERE u.username = 'admin_super' LIMIT 1;

-- ----------------------------------------------------------------------------
-- 4. BẢNG LÃI SUẤT TIẾT KIỆM & CHO VAY (interest_rates)
-- ----------------------------------------------------------------------------
INSERT INTO interest_rates (product_code, term_months, rate_percentage, effective_date, created_by)
SELECT 'TIET_KIEM_ONLINE_1M', 1, 3.10, CURDATE(), u.user_id FROM users u WHERE u.username = 'admin_super' LIMIT 1;

INSERT INTO interest_rates (product_code, term_months, rate_percentage, effective_date, created_by)
SELECT 'TIET_KIEM_ONLINE_3M', 3, 3.60, CURDATE(), u.user_id FROM users u WHERE u.username = 'admin_super' LIMIT 1;

INSERT INTO interest_rates (product_code, term_months, rate_percentage, effective_date, created_by)
SELECT 'TIET_KIEM_ONLINE_6M', 6, 4.90, CURDATE(), u.user_id FROM users u WHERE u.username = 'admin_super' LIMIT 1;

INSERT INTO interest_rates (product_code, term_months, rate_percentage, effective_date, created_by)
SELECT 'TIET_KIEM_ONLINE_9M', 9, 5.10, CURDATE(), u.user_id FROM users u WHERE u.username = 'admin_super' LIMIT 1;

INSERT INTO interest_rates (product_code, term_months, rate_percentage, effective_date, created_by)
SELECT 'TIET_KIEM_ONLINE_12M', 12, 6.20, CURDATE(), u.user_id FROM users u WHERE u.username = 'admin_super' LIMIT 1;

INSERT INTO interest_rates (product_code, term_months, rate_percentage, effective_date, created_by)
SELECT 'TIET_KIEM_ONLINE_24M', 24, 6.50, CURDATE(), u.user_id FROM users u WHERE u.username = 'admin_super' LIMIT 1;

INSERT INTO interest_rates (product_code, term_months, rate_percentage, effective_date, created_by)
SELECT 'VAY_MUA_NHA_UU_DAI', 12, 5.90, CURDATE(), u.user_id FROM users u WHERE u.username = 'admin_super' LIMIT 1;

INSERT INTO interest_rates (product_code, term_months, rate_percentage, effective_date, created_by)
SELECT 'VAY_MUA_XE_TRA_GOP', 12, 6.80, CURDATE(), u.user_id FROM users u WHERE u.username = 'admin_super' LIMIT 1;

INSERT INTO interest_rates (product_code, term_months, rate_percentage, effective_date, created_by)
SELECT 'VAY_SAN_XUAT_KINH_DOANH', 12, 7.20, CURDATE(), u.user_id FROM users u WHERE u.username = 'admin_super' LIMIT 1;

-- ----------------------------------------------------------------------------
-- 5. BIỂU PHÍ & BIỂU MẪU ĐÍNH KÈM (fee_templates)
-- ----------------------------------------------------------------------------
INSERT INTO fee_templates (title, file_path, file_type, is_active, created_by)
SELECT 'Biểu phí dịch vụ Thẻ quốc tế Vietcombank Visa / MasterCard / JCB 2026', '/uploads/fees/Bieu_phi_the_quoc_te_2026.pdf', 'PDF', TRUE, u.user_id FROM users u WHERE u.username = 'admin_super' LIMIT 1;

INSERT INTO fee_templates (title, file_path, file_type, is_active, created_by)
SELECT 'Biểu mẫu đề nghị vay vốn & phương án trả nợ kiêm cam kết tài sản', '/uploads/forms/Don_de_nghi_vay_von_VCB.docx', 'WORD', TRUE, u.user_id FROM users u WHERE u.username = 'admin_super' LIMIT 1;

INSERT INTO fee_templates (title, file_path, file_type, is_active, created_by)
SELECT 'Bảng tổng hợp phí chuyển tiền quốc tế qua hệ thống SWIFT & Western Union', '/uploads/fees/Phi_chuyen_tien_quoc_te_SWIFT.xlsx', 'EXCEL', TRUE, u.user_id FROM users u WHERE u.username = 'admin_super' LIMIT 1;

-- ----------------------------------------------------------------------------
-- 6. GIAO DỊCH TÀI CHÍNH TẠI QUẦY (financial_transactions)
-- ----------------------------------------------------------------------------
INSERT INTO financial_transactions (transaction_code, sender_customer_id, receiver_account_number, receiver_name, bank_name, amount, fee, description, processed_by_staff_id, status)
SELECT 'FT2609010001', c.customer_id, '0071001234567', 'Nguyễn Thị Thu Trang', 'Vietcombank', 35000000.00, 0.00, 'Nạp tiền vào tài khoản tiết kiệm online', u.user_id, 'SUCCESS'
FROM customers c, users u WHERE u.username = 'nv_hoangnam' LIMIT 1;

INSERT INTO financial_transactions (transaction_code, sender_customer_id, receiver_account_number, receiver_name, bank_name, amount, fee, description, processed_by_staff_id, status)
SELECT 'FT2609020002', c.customer_id, '1903555888999', 'Công ty Cổ phần Xây dựng Hà Đô', 'Techcombank', 120000000.00, 11000.00, 'Chuyển tiền thanh toán đợt 2 gói thầu vật liệu', u.user_id, 'SUCCESS'
FROM customers c, users u WHERE u.username = 'nv_hoangnam' LIMIT 1;

INSERT INTO financial_transactions (transaction_code, sender_customer_id, receiver_account_number, receiver_name, bank_name, amount, fee, description, processed_by_staff_id, status)
SELECT 'FT2609030003', c.customer_id, '0451000999888', 'Lê Tuấn Khang', 'Vietcombank', 5000000.00, 0.00, 'Rút tiền mặt tại quầy giao dịch', u.user_id, 'SUCCESS'
FROM customers c, users u WHERE u.username = 'nv_hoangnam' LIMIT 1;

INSERT INTO financial_transactions (transaction_code, sender_customer_id, receiver_account_number, receiver_name, bank_name, amount, fee, description, processed_by_staff_id, status)
SELECT 'FT2609040004', c.customer_id, '1012888999', 'Trần Đình Trọng', 'BIDV', 450000000.00, 22000.00, 'Chuyển tiền mua xe ô tô cá nhân', u.user_id, 'PENDING_APPROVAL'
FROM customers c, users u WHERE u.username = 'nv_hoangnam' LIMIT 1;

INSERT INTO financial_transactions (transaction_code, sender_customer_id, receiver_account_number, receiver_name, bank_name, amount, fee, description, processed_by_staff_id, status)
SELECT 'FT2609050005', c.customer_id, '999988887777', 'Vũ Hải Đăng', 'MBBank', 8500000.00, 0.00, 'Chuyển tiền sinh hoạt phí gia đình', u.user_id, 'SUCCESS'
FROM customers c, users u WHERE u.username = 'nv_hoangnam' LIMIT 1;

-- ----------------------------------------------------------------------------
-- 7. TƯ VẤN KHÁCH HÀNG CRM (customer_advisories)
-- ----------------------------------------------------------------------------
INSERT INTO customer_advisories (customer_id, staff_id, product_type, notes, status)
SELECT c.customer_id, u.user_id, 'Gói vay mua nhà an cư 15 năm', 'Khách hàng có thu nhập ổn định 35 triệu/tháng, đã giải thích biểu phí và lãi suất cố định 24 tháng đầu 6.0%. Đang chờ khách chuẩn bị sổ đỏ đối ứng.', 'FOLLOW_UP'
FROM customers c, users u WHERE u.username = 'nv_hoangnam' LIMIT 1;

INSERT INTO customer_advisories (customer_id, staff_id, product_type, notes, status)
SELECT c.customer_id, u.user_id, 'Thẻ tín dụng Vietcombank CashBack Plus', 'Tư vấn mở thẻ tín dụng hạn mức 80 triệu, hoàn tiền 10% chi tiêu ẩm thực và siêu thị. Khách hàng đã nộp sao kê tài khoản ngân hàng.', 'COMPLETED'
FROM customers c, users u WHERE u.username = 'nv_hoangnam' LIMIT 1;

INSERT INTO customer_advisories (customer_id, staff_id, product_type, notes, status)
SELECT c.customer_id, u.user_id, 'Dịch vụ Tiền gửi Doanh nghiệp lãi suất thỏa thuận', 'Tư vấn doanh nghiệp mở tài khoản thanh toán và gửi tiền gửi có kỳ hạn 3 tháng với số dư 10 tỷ đồng.', 'CONSULTED'
FROM customers c, users u WHERE u.username = 'nv_hoangnam' LIMIT 1;

-- ----------------------------------------------------------------------------
-- 8. TIẾP NHẬN & XỬ LÝ TICKET CSKH (support_tickets & support_ticket_logs)
-- ----------------------------------------------------------------------------
INSERT INTO support_tickets (ticket_code, customer_id, assigned_staff_id, title, content, priority, status)
SELECT 'TK-2026-1011', c.customer_id, u.user_id, 'Cần nâng hạn mức giao dịch chuyển tiền VCB Digibank', 'Khách hàng muốn nâng hạn mức chuyển tiền trực tuyến từ 100 triệu lên 500 triệu/ngày để thanh toán tiền hàng cho đối tác.', 'HIGH', 'IN_PROGRESS'
FROM customers c, users u WHERE u.username = 'nv_hoangnam' LIMIT 1;

INSERT INTO support_tickets (ticket_code, customer_id, assigned_staff_id, title, content, priority, status)
SELECT 'TK-2026-1012', c.customer_id, u.user_id, 'Cây ATM nuốt thẻ ghi nợ Vietcombank Connect24', 'Khách hàng rút tiền tại cây ATM số 12 chi nhánh Hoàn Kiếm bị giữ thẻ lúc 18h30 ngày hôm qua.', 'MEDIUM', 'RESOLVED'
FROM customers c, users u WHERE u.username = 'nv_hoangnam' LIMIT 1;

INSERT INTO support_ticket_logs (ticket_id, staff_id, action_note)
SELECT t.ticket_id, u.user_id, 'Đã kiểm tra cây ATM 12, thủ quỹ đã thu hồi thẻ an toàn. Đã gọi điện mời khách hàng mang theo CCCD đến quầy nhận lại thẻ miễn phí.'
FROM support_tickets t, users u WHERE t.ticket_code = 'TK-2026-1012' AND u.username = 'nv_hoangnam' LIMIT 1;

INSERT INTO support_tickets (ticket_code, customer_id, assigned_staff_id, title, content, priority, status)
SELECT 'TK-2026-1013', c.customer_id, u.user_id, 'Thẻ tín dụng phát sinh giao dịch lạ ở trang thương mại điện tử quốc tế', 'Khách hàng nhận được tin nhắn trừ 25 USD tại dịch vụ nghe nhạc trực tuyến nước ngoài mà không thực hiện.', 'URGENT', 'IN_PROGRESS'
FROM customers c, users u WHERE u.username = 'nv_hoangnam' LIMIT 1;

INSERT INTO support_ticket_logs (ticket_id, staff_id, action_note)
SELECT t.ticket_id, u.user_id, 'Đã ngay lập tức khóa thẻ tạm thời trên hệ thống CMS để bảo vệ số dư tài khoản của khách và chuyển hồ sơ sang bộ phận Tra soát thẻ.'
FROM support_tickets t, users u WHERE t.ticket_code = 'TK-2026-1013' AND u.username = 'nv_hoangnam' LIMIT 1;

-- ----------------------------------------------------------------------------
-- 9. TRA SOÁT GIAO DỊCH (dispute_requests)
-- ----------------------------------------------------------------------------
INSERT INTO dispute_requests (dispute_code, customer_id, transaction_code, reason, status, handler_staff_id, resolution_note)
SELECT 'TS-2026-0891', c.customer_id, 'FT2609019988', 'Chuyển nhầm tiền sang số tài khoản ngân hàng khác do nhập sai 1 chữ số', 'PROCESSING', u.user_id, 'Đã gửi công văn tra soát NAPAS sang ngân hàng thụ hưởng yêu cầu hỗ trợ phong tỏa số tiền chuyển nhầm.'
FROM customers c, users u WHERE u.username = 'nv_hoangnam' LIMIT 1;

INSERT INTO dispute_requests (dispute_code, customer_id, transaction_code, reason, status, handler_staff_id, resolution_note)
SELECT 'TS-2026-0892', c.customer_id, 'FT2609025544', 'Rút tiền ATM 2,000,000 VND tài khoản bị trừ tiền nhưng khay tiền không nhả tiền mặt', 'APPROVED_REFUND', u.user_id, 'Kiểm toán quỹ ATM phát hiện thừa 2,000,000 VND. Đã thực hiện hoàn tiền vào tài khoản cho khách hàng thành công.'
FROM customers c, users u WHERE u.username = 'nv_hoangnam' LIMIT 1;

INSERT INTO dispute_requests (dispute_code, customer_id, transaction_code, reason, status, handler_staff_id, resolution_note)
SELECT 'TS-2026-0893', c.customer_id, 'POS2609031122', 'Thanh toán tại quầy siêu thị POS báo lỗi giao dịch nhưng ứng dụng ngân hàng vẫn trừ 850,000 VND', 'PENDING', u.user_id, NULL
FROM customers c, users u WHERE u.username = 'nv_hoangnam' LIMIT 1;

-- ----------------------------------------------------------------------------
-- 10. HỒ SƠ TÍN DỤNG & PHÊ DUYỆT (applications & loan_applications & approvals)
-- ----------------------------------------------------------------------------
INSERT INTO applications (application_code, customer_id, application_type, requested_amount, status)
SELECT 'VCB-APP-2026-9001', c.customer_id, 'LOAN', 800000000.00, 'APPROVED'
FROM customers c LIMIT 1
ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT INTO loan_applications (application_id, loan_purpose, loan_amount, loan_term_months, interest_rate_percentage)
SELECT a.application_id, 'CONSUMER', 800000000.00, 60, 7.50
FROM applications a WHERE a.application_code = 'VCB-APP-2026-9001' LIMIT 1
ON DUPLICATE KEY UPDATE loan_amount=VALUES(loan_amount);

INSERT INTO application_approvals (application_id, manager_id, action, reason_note)
SELECT a.application_id, u.user_id, 'APPROVED', 'Khách hàng có CIC chuẩn, thu nhập chuyển khoản ngân hàng rõ ràng, tài sản thế chấp đạt chuẩn định giá.'
FROM applications a, users u WHERE a.application_code = 'VCB-APP-2026-9001' AND u.username IN ('ql_minhtuan', 'manager_dev', 'admin_super') LIMIT 1;

INSERT INTO applications (application_code, customer_id, application_type, requested_amount, status)
SELECT 'VCB-APP-2026-9002', c.customer_id, 'CARD_ISSUANCE', 100000000.00, 'PENDING'
FROM customers c LIMIT 1
ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT INTO applications (application_code, customer_id, application_type, requested_amount, status)
SELECT 'VCB-APP-2026-9003', c.customer_id, 'LOAN', 1500000000.00, 'DOCS_REQUIRED'
FROM customers c LIMIT 1
ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT INTO application_approvals (application_id, manager_id, action, reason_note)
SELECT a.application_id, u.user_id, 'REQUEST_DOCS', 'Yêu cầu khách hàng bổ sung hợp đồng mua bán căn hộ có công chứng và sao kê thuế thu nhập cá nhân 6 tháng gần nhất.'
FROM applications a, users u WHERE a.application_code = 'VCB-APP-2026-9003' AND u.username IN ('ql_minhtuan', 'manager_dev', 'admin_super') LIMIT 1;

-- ----------------------------------------------------------------------------
-- 11. BÀI VIẾT TIN TỨC & ƯU ĐÃI CMS (posts)
-- ----------------------------------------------------------------------------
INSERT INTO posts (title, slug, summary, content, thumbnail_url, category_id, author_id, status, published_at)
SELECT
'Vietcombank miễn 100% phí chuyển tiền trực tuyến và quản lý tài khoản trên VCB Digibank',
'mien-phi-chuyen-tien-digibank-2026',
'Chính sách zero fee toàn diện giúp hàng triệu khách hàng giao dịch tài chính hoàn toàn miễn phí, an toàn và thuận tiện.',
'<p>Nhằm đem lại trải nghiệm số vượt trội cho khách hàng cá nhân và doanh nghiệp, Vietcombank chính thức áp dụng chính sách miễn toàn bộ phí chuyển tiền trong và ngoài hệ thống 24/7, không thu phí duy trì tài khoản và không yêu cầu số dư tối thiểu...</p>',
'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop',
1,
u.user_id,
'PUBLISHED',
NOW()
FROM users u WHERE u.username = 'admin_super' LIMIT 1
ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO posts (title, slug, summary, content, thumbnail_url, category_id, author_id, status, published_at)
SELECT
'Gói vay mua nhà An Cư 2026: Lãi suất cố định chỉ từ 5.5%/năm đồng hành cùng tổ ấm',
'goi-vay-mua-nha-an-cu-2026',
'Chương trình tín dụng quy mô 50.000 tỷ đồng với thời gian vay lên đến 30 năm, ân hạn nợ gốc tới 24 tháng cho khách hàng trẻ.',
'<p>Vietcombank tự hào ra mắt gói giải pháp tín dụng An Cư dành riêng cho khách hàng có nhu cầu mua nhà ở thực. Với mức lãi suất ưu đãi vượt trội cố định từ 5.5%/năm trong 12 tháng đầu hoặc 6.5%/năm trong 24 tháng đầu...</p>',
'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop',
1,
u.user_id,
'PUBLISHED',
NOW()
FROM users u WHERE u.username = 'admin_super' LIMIT 1
ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO posts (title, slug, summary, content, thumbnail_url, category_id, author_id, status, published_at)
SELECT
'Ưu đãi hoàn tiền 10% cho chủ thẻ Vietcombank Visa Signature tại hệ thống nhà hàng & khách sạn 5 sao',
'uu-dai-hoan-tien-visa-signature-2026',
'Đặc quyền thượng lưu không giới hạn cùng thẻ đen Vietcombank Visa Signature: Miễn phí phòng chờ sân bay quốc tế và bảo hiểm du lịch toàn cầu.',
'<p>Từ ngày 01/09/2026 đến hết 31/12/2026, các chủ thẻ tín dụng Vietcombank Visa Signature khi chi tiêu ẩm thực, nghỉ dưỡng tại hệ thống đối tác liên kết sẽ nhận ngay mức hoàn tiền 10% tối đa 2.000.000 VND mỗi kỳ sao kê...</p>',
'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&auto=format&fit=crop',
2,
u.user_id,
'PUBLISHED',
NOW()
FROM users u WHERE u.username = 'admin_super' LIMIT 1
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- ----------------------------------------------------------------------------
-- 12. AUDIT LOGS NHẬT KÝ HỆ THỐNG (audit_logs)
-- ----------------------------------------------------------------------------
INSERT INTO audit_logs (user_id, action_type, module_name, ip_address, status, description, payload_after)
SELECT u.user_id, 'UPDATE_EXCHANGE_RATE', 'FluctuatingData', '192.168.1.10', 'SUCCESS', 'Cập nhật bảng tỷ giá ngoại tệ ngày hôm nay (USD, EUR, GBP, JPY)', '{"currencies": ["USD", "EUR", "GBP", "JPY"], "status": "ACTIVE"}'
FROM users u WHERE u.username = 'admin_super' LIMIT 1;

INSERT INTO audit_logs (user_id, action_type, module_name, ip_address, status, description, payload_after)
SELECT u.user_id, 'APPROVE_LOAN_APPLICATION', 'Approval', '192.168.1.15', 'SUCCESS', 'Phê duyệt hồ sơ vay tiêu dùng VCB-APP-2026-9001 số tiền 800,000,000 VND', '{"appCode": "VCB-APP-2026-9001", "decision": "APPROVED", "amount": 800000000}'
FROM users u WHERE u.username IN ('ql_minhtuan', 'manager_dev', 'admin_super') LIMIT 1;

INSERT INTO audit_logs (user_id, action_type, module_name, ip_address, status, description, payload_after)
SELECT u.user_id, 'PROCESS_APPOINTMENT', 'StaffModule', '192.168.1.25', 'SUCCESS', 'Giao dịch viên tiếp nhận và hoàn tất phục vụ lịch hẹn chatbot VCB-APT-2026-20004', '{"appointmentCode": "VCB-APT-2026-20004", "status": "COMPLETED"}'
FROM users u WHERE u.username = 'nv_hoangnam' LIMIT 1;

SELECT 'Hoàn tất thêm dữ liệu mẫu vào database admin_portal_db thành công!' AS result;
