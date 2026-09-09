# KẾ HOẠCH THỰC THI DỰ ÁN — Admin Portal Ngân hàng

> Cặp đôi công nghệ: Backend **Spring Boot 3 (Java 17, Maven)** + Frontend **React 18 (Vite) + Ant Design 5**
> DB: MySQL `admin_portal_db` ([db/schema.sql](../db/schema.sql) + [db/data.sql](../db/data.sql))
> Tài liệu chức năng: [docs/FEATURE_CHECKLIST.md](FEATURE_CHECKLIST.md)

---

## Kiến trúc tổng thể & cấu trúc thư mục dự kiến

```
C:\BTL\
├── db/                          # schema.sql, data.sql (ĐÃ CÓ)
├── docs/                        # FEATURE_CHECKLIST.md, IMPLEMENTATION_PLAN.md
├── backend/                     # Spring Boot 3, Java 17
│   ├── pom.xml
│   └── src/main/java/com/bank/admin/
│       ├── config/              # SecurityConfig, CorsConfig, OpenApiConfig
│       ├── security/            # JwtService, JwtAuthFilter, OTP service
│       ├── common/              # ApiResponse wrapper, GlobalExceptionHandler, @AuditLog + aspect
 AuditLogAspect
│       ├── auth/                # AuthController/Service/DTOs (login 2 bước, OTP, refresh, logout)
│       ├── user/                # User CRUD + phân quyền RBAC
│       ├── rates/               # ExchangeRate / GoldRate / InterestRate / FeeTemplate + Excel import
│       ├── approval/            # Applications, documents, decisions, notification mock
│       ├── report/              # Dashboard stats, filters, export excel/pdf/csv
│       ├── cms/                 # Posts, categories, upload file
│       └── audit/               # AuditLog entity/repo/query API
├── frontend/                    # React 18 + Vite + Ant Design 5
│   └── src/
│       ├── api/                 # axios instance (interceptor refresh token), từng module api
│       ├── components/          # Layout (Sider+Header), GuardedRoute, PermissionButton...
│ based on permission
│       ├── pages/
│       │   ├── Login/           # Form 2 bước: password → OTP
│       │   ├── DataManagement/  # 4 trang tỷ giá/vàng/lãi suất/biểu phí + Import Excel
│       │   ├── Approvals/       # Danh sách hồ sơ + chi tiết + modal quyết định
│       │   ├── Reports/         # Charts + filters + export
│       │   ├── System/          # Users/Roles/AuditLogs
│       │   └── Cms/             # Posts list/editor
│       ├── store/authContext    # Context lưu user + permissions, logout
│       └── utils/               # format tiền tệ, ngày tháng
└── README.md
```

## Quy ước chung (áp dụng mọi module)

- **API Response**: `{ success, message, data }` bọc bởi `ApiResponse<T>`; lỗi tập trung ở `GlobalExceptionHandler`.
- **Auth**: JWT Bearer; authority = permission_code (`SYS_MANAGE_USERS`, `DATA_UPDATE_RATES`, `APPROVE_JUR`...). `@PreAuthorize("hasAuthority('DATA_UPDATE_RATES')")`.
- **Audit**: annotation `@AuditLog(module="...", action="...")` + Spring AOP ghi vào `audit_logs` với payload before/after.
- **Pagination**: chuẩn `?page=&size=&sort=` trả về Spring Pageable JSON.
- **FE**: mỗi trang = `ProTable-like Table` + Modal/Drawer form; axios tự refresh token khi 401.

## Thứ tự triển khai theo Module (code lần lượt)

### Phase 0 — Khởi tạo dự án (mốc bắt đầu)
- [ ] Backend: spring-boot-starter-web, security, data-jpa, validation, mysql-connector, jjwt, springdoc-openapi, poi (excel), itext/pdf, spring-boot-starter-aop
- [ ] `application.yml`: datasource admin_portal_db, JPA validate, JWT secret/expiry config
- [ ] Frontend: `npm create vite@latest` React-JS + antd, dayjs, axios, react-router-dom, @ant-design/charts, papaparse (CSV), xlsx (import/export FE-side nếu cần)
- [ ] Chạy schema + data SQL lên DB local

### Phase 1 — Module 1: Xác thực & Security (nền móng, làm đầu tiên)
Backend:
1. Entity User/Role/Permission + Repository
2. JwtService (generate/validate/refresh), JwtAuthenticationFilter
3. SecurityConfig: permit `/auth/**`, còn lại authenticated; CORS cho FE
4. AuthController: login → temp_token; verify-otp → access+refresh token; resend-otp; logout; change-password
5. OTP service: sinh mã 6 số, TTL 5 phút, gửi "email" (log ra console) — dev mode hiển thị OTP trong response để test
6. Seed 2 users mẫu (admin_super / manager_dev) khớp data.sql
Frontend:
7. LoginPage 2 bước (Steps component): form đăng nhập → form nhập OTP
8. AuthContext + ProtectedRoute + axios interceptor (401 → refresh → retry)
9. Layout chính: Sider menu lọc menu item theo permission của user

**Kết quả phase:** Đăng nhập được 2FA, vào được layout với menu theo quyền.

### Phase 2 — Module 2: Dữ liệu biến động (tỷ giá/vàng/lãi suất/biểu phí)
1. Entities + Repositories cho 4 bảng rates
2. Service + Controller CRUD cho từng loại (kèm unique currency+date)
3. Endpoint import Excel: parse Apache POI → batch insert/update
4. `@AuditLog` cho mọi thao tác ghi
5. FE: 4 trang bảng + modal thêm/sửa + nút xóa (Popconfirm) + nút Import (Upload file) + filter theo ngày hiệu lực
6. FE format số tiền VNĐ, ngày dd/MM/yyyy

**Kết quả phase:** Quản trị viên cập nhật tỷ giá/vàng/lãi suất qua UI hoặc import Excel.

### Phase 3 — Module 3: Phê duyệt hồ sơ
1. Entities Application/Customer/Document/Approval + repo
2. GET danh sách hồ sơ (filter status/type/code, phân trang); GET chi tiết kèm documents + history approvals
3. POST decision: validate trạng thái PENDING hoặc DOCS_REQUIRED; cập nhật status; insert application_approvals
4. Mock NotificationClient (Core Banking + Email/SMS): log ra console/file
5. `@AuditLog` decision
6. FE: trang danh sách (Tabs theo trạng thái) + trang chi tiết (Descriptions + List documents + Timeline lịch sử) + Modal quyết định (radio APPROVED/REJECTED/REQUEST_DOCS + textarea lý do bắt buộc khi REJECTED/REQUEST_DOCS)
7. FE: Badge đếm hồ sơ chờ xử lý trên menu

**Kết quả phase:** Manager duyệt/từ chối/yêu cầu bổ sung hồ sơ, có lịch sử xử lý và audit trail đầy đủ.

### Phase 4 — Module 4: Báo cáo & thống kê
1. DTO thống kê: tổng HS theo trạng thái, tổng tiền duyệt theo tháng, tỷ giá USD/EUR theo ngày, top currencies
2. GET /reports/dashboard trả các aggregate; filter from/to date + type
3. Export: Apache POI (Excel), OpenPDF (PDF), CSV thuần; lưu record vào report_exports; endpoint download file đã xuất
4. FE: Dashboard với @ant-design/charts (Line chart tỷ giá, Pie/Column theo trạng thái), RangePicker filter, Dropdown export 3 định dạng
5. Trang lịch sử xuất (report_exports) nhỏ trong tab phụ

**Kết quả phase:** Dashboard biểu đồ + xuất báo cáo 3 định dạng, lưu vết lịch sử xuất.

### Phase 5 — Module 5: RBAC quản lý tài khoản
1. User CRUD + check duplicate username/email (trả 409 Conflict)
2. Gán/thu hồi vai trò cho user; CRUD roles + gán permissions cho role
3. FE: trang Users (Table + Drawer tạo/sửa + Transfer/Checkbox gán roles) ; trang Roles (Table + Checkbox nhóm quyền)
4. Khi sửa chính mình: cấm tự khoá/tự gỡ role ADMIN của bản thân (guard BE)
5. FE badge "LOCKED" tag màu đỏ; toggle ACTIVE/LOCKED
6. Audit mọi thao tác

**Kết quả phase:** Admin tạo tài khoản nhân sự mới, gán role; manager không thấy menu System.

### Phase 6 — Module 6: CMS + Audit Log
1. Post CRUD + slug generator + thumbnail upload (lưu local uploads/, serve static resource handler)
2. Category CRUD đơn giản
3. FE: trang Posts (Table + Modal editor với Upload ảnh + RichText đơn giản textarea HTML) + preview
4. Audit log query API: filter user/action/module/date + pagination
5. AOP aspect hoàn thiện: capture before/after payload JSON, IP, user agent
6. FE trang Audit Logs: ProTable filter, xem payload JSON diff trước/sau
7. E2E test toàn hệ thống, fix bug, polish UI

**Kết quả phase:** CMS hoạt động, audit log đầy đủ, dự án hoàn chỉnh demo end-to-end.

---

## Tiêu chí hoàn thành (Definition of Done) toàn dự án

- [ ] Đăng nhập 2FA hoạt động, JWT refresh/logout đúng
- [ ] Menu FE ẩn/hiện theo permission; BE chặn 403 khi vượt quyền
- [ ] CRUD đủ 4 loại dữ liệu biến động + import Excel
- [ ] Approval flow 3 hành động + lịch sử + thông báo mock
- Reports dashboard charts + export Excel/PDF/CSV
- [ ] Quản lý user/role/permission đầy đủ, chống duplicate
- [ ] CMS bài viết + upload thumbnail
- [ ] Mọi thao tác ghi đều có record trong audit_logs (payload before/after)
- [ ] Swagger UI chạy tại /swagger-ui.html
- [ ] FE build production thành công

## Rủi ro & lưu ý kỹ thuật

| Rủi ro | Giải pháp |
|--------|-----------|
| OTP email thật | Dev mode: OTP hiện trong response + console log; prod: tích hợp SMTP/SMS gateway |
| File upload path | Cấu hình ngoài (application.yml), tạo thư mục tự động |
| Excel format lệch | Template mẫu cố định hàng tiêu đề; validate từng dòng, skip dòng lỗi + báo cáo kết quả import |
| Token hết hạn giữa chừng | Axios interceptor auto-refresh một lần rồi retry request |
| Concurrent rate update | Unique key (currency_code, effective_date) → upsert logic, bắt DataIntegrityViolationException |
| PDF font tiếng Việt | OpenPDF + font DejaVu Sans (bundle vào resources/fonts) |
| JSON payload audit | Serialize bằng Jackson, giới hạn 2000 ký tự/trường |
| CORS dev | Cho phép http://localhost:5173 |
