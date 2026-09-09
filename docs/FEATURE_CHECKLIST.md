# MASTER FEATURE CHECKLIST — Hệ thống Admin Portal Ngân hàng

> Tài liệu tham chiếu CHÍNH (Master Reference) cho toàn bộ dự án.
> Stack: Backend **Spring Boot 3 + Java 17 + MySQL 8 + Spring Security (JWT + OTP)** | Frontend **React 18 + Vite + Ant Design 5**
> DB: `admin_portal_db` — schema tại [db/schema.sql](../db/schema.sql), dữ liệu mẫu tại [db/data.sql](../db/data.sql)

---

## Module 1 — XÁC THỰC & AN TOÀN HỆ THỐNG (Authentication & Security)

| # | Chức năng | Mô tả | Bảng liên quan | API | FE Page |
|---|-----------|-------|----------------|-----|---------|
| 1.1 | Đăng nhập bước 1 | Username/Password → trả về `temp_token` (chưa kích hoạt) | `users` | `POST /api/v1/auth/login` | `/login` |
| 1.2 | Đăng nhập bước 2 (OTP) | Xác thực mã OTP (email/SMS giả lập) → cấp JWT | `users.otp_secret`, `otp_expiry` | `POST /api/v1/auth/verify-otp`, `POST /api/v1/auth/resend-otp` | `/login` (bước OTP) |
| 1.3 | Quản lý Token | Khởi tạo / kiểm tra / thu hồi JWT (refresh + logout) | — (in-memory token store) | `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout` | Axios interceptor |
| 1.4 | Đổi mật khẩu | Đổi password khi đã đăng nhập | `users.password_hash` | `PUT /api/v1/auth/change-password` | Modal trong Header |

- [ ] Backend: Spring Security filter chain, JWT provider, OTP service
- [ ] Frontend: Login flow 2 bước, guard route, lưu token

## Module 2 — CẬP NHẬT DỮ LIỆU BIẾN ĐỘNG (Dynamic Data Management)

| # | Chức năng | Mô tả | Bảng | API base | FE Route |
|---|-----------|-------|------|----------|----------|
| 2.1 | Tỷ giá ngoại tệ | CRUD tỷ giá mua/bán/chuyển khoản theo ngày hiệu lực | `exchange_rates` | `/api/v1/exchange-rates` | `/data/exchange-rates` |
| 2.2 | Giá vàng | CRUD giá mua/bán SJC, 24K, 18K… | `gold_rates` | `/api/v1/gold-rates` | `/data/gold-rates` |
| 2.3 | Lãi suất | Thiết lập % lãi suất TK/vay theo sản phẩm & kỳ hạn | `interest_rates` | `/api/v1/interest-rates` | `/data/interest-rates` |
| 2.4 | Biểu mẫu & biểu phí | Upload/quản lý file excel/pdf biểu phí | `fee_templates` | `/api/v1/fee-templates` | `/data/fee-templates` |
| 2.5 | Import Excel/CSV | Nhập liệu hàng loạt cho 2.1–2.3 | — | `POST .../import` | Nút "Import" trên mỗi trang |

- [ ] Quyền yêu cầu: `DATA_UPDATE_RATES`
- [ ] Mọi thao tác ghi phải ghi Audit Log

## Module 3 — PHÊ DUYỆT HỒ SƠ & GIAO DỊCH (Approval Workflow)

| # | Chức năng | Mô tả | Bảng | API base | FE Route |
|---|-----------|-------|------|----------|----------|
| 3.1 | Tra cứu hồ sơ | Danh sách + chi tiết hồ sơ, chứng từ đính kèm | `applications`, `customers`, `application_documents` | `/api/v1/applications` | `/approvals`, `/approvals/:id` |
| 3.2 | Phê duyệt / Từ chối | `APPROVED` / `REJECTED` kèm ghi chú | `application_approvals` | `POST /api/v1/applications/{id}/decision` | Nút hành động trên chi tiết |
| 3.3 | Yêu cầu bổ sung | Trạng thái `DOCS_REQUIRED` + lý do | `application_approvals` | như trên (action=`REQUEST_DOCS`) | như trên |
| 3.4 | Kích hoạt thông báo | Gọi API Core Banking (mock) + Email/SMS sau quyết định | — | nội bộ service | — |

- [ ] Quyền yêu cầu: `APPROVE_LOAN`
- [ ] Không cho xử lý hồ sơ đã kết thúc (`APPROVED`/`REJECTED`)

## Module 4 — BÁO CÁO & THỐNG KÊ (Reports & Analytics)

| # | Chức năng | Mô tả | Bảng | API base | FE Route |
|---|-----------|-------|------|----------|----------|
| 4.1 | Dashboard | Biểu đồ tổng hợp (tỷ giá theo ngày, số HS theo trạng thái…) | nhiều bảng | `/api/v1/reports/dashboard` | `/reports/dashboard` |
| 4.2 | Bộ lọc | Loại báo cáo, khoảng thời gian, loại giao dịch | — | query params | Form trên trang báo cáo |
| 4.3 | Xuất file | Excel / PDF / CSV + lưu lịch sử xuất | `report_exports` | `GET /api/v1/reports/export?format=...` | `/reports/dashboard` |

- [ ] Quyền yêu cầu: `REPORT_EXPORT`
- [ ] FE dùng Ant Design Charts (@ant-design/charts)

## Module 5 — QUẢN LÝ HỆ THỐNG & PHÂN QUYỀN (RBAC)

| # | Chức năng | Mô tả | Bảng | API base | FE Route |
|---|-----------|-------|------|----------|----------|
| 5.1 | Quản lý tài khoản | Tạo/sửa/khoá nhân sự, check trùng email/username | `users` | `/api/v1/users` | `/system/users` |
| 5.2 | Phân quyền | Gán vai trò & quyền chi tiết | `roles`, `permissions`, `user_roles`, `role_permissions` | `/api/v1/users/{id}/roles`, `/api/v1/roles` | `/system/users`, `/system/roles` |

- [ ] Quyền yêu cầu: `SYS_MANAGE_USERS`
- [ ] BE: `@PreAuthorize("hasAuthority('...')")` trên từng endpoint

## Module 6 — CMS & AUDIT LOG

| # | Chức năng | Mô tả | Bảng | API base | FE Route |
|---|-----------|-------|------|----------|----------|
| 6.1 | Quản lý bài viết | CRUD bài viết + thumbnail + xuất bản (DRAFT/PUBLISHED/ARCHIVED) | `posts`, `categories` | `/api/v1/posts`, `/api/v1/categories` | `/cms/posts`, `/cms/posts/edit/:id` |
| 6.2 | Upload ảnh đại diện | Upload file ảnh, trả URL | — | `POST /api/v1/files/upload` | Trong form bài viết |
| 6.3 | Audit Log | Tự động ghi vết mọi thao tác CRUD: user, thời gian, IP, action, payload before/after | `audit_logs` | `GET /api/v1/audit-logs` | `/system/audit-logs` |

- [ ] Quyền: `CMS_MANAGE_POST` (CMS); xem audit log = `SYS_MANAGE_USERS`
- [ ] BE: AOP annotation `@AuditLog(action=..., module=...)` tự động ghi vết
