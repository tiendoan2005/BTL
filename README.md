# Admin Portal Ngân hàng — BTL

Hệ thống quản trị dành cho ngân hàng: xác thực 2FA, cập nhật dữ liệu biến động (tỷ giá/vàng/lãi suất), phê duyệt hồ sơ, báo cáo thống kê, phân quyền RBAC, CMS và Audit Log.

## Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Backend | Spring Boot 3 · Java 17 · Maven · Spring Security (JWT + OTP) · Spring Data JPA |
| Database | MySQL 8 — `admin_portal_db` |
| Frontend | React 18 · Vite · Ant Design 5 · Axios · React Router · @ant-design/charts |
| Xuất file | Apache POI (Excel) · OpenPDF (PDF) · CSV |

## Tài liệu

- [docs/FEATURE_CHECKLIST.md](docs/FEATURE_CHECKLIST.md) — **Master Feature Checklist** (tài liệu tham chiếu chính)
- [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) — Kế hoạch thực thi theo 7 phase
- [db/schema.sql](db/schema.sql) / [db/data.sql](db/data.sql) — Cơ sở dữ liệu + dữ liệu mẫu

## Cấu trúc

```
C:\BTL\
├── db/          # SQL schema + seed data
├── docs/        # Tài liệu dự án
├── backend/     # Spring Boot API
└── frontend/    # React Admin SPA
```

## Chạy dự án (sau khi init code)

```bash
# 1. Database
mysql -u root -p < db/schema.sql
mysql -u root -p < db/data.sql

# 2. Backend (cổng 8080)
cd backend && ./mvnw spring-boot:run

# 3. Frontend (cổng 5173)
cd frontend && npm install && npm run dev
```

## Tài khoản mẫu (dev)

| Username | Vai trò | Quyền |
|---|---|---|
| `admin_super` | ROLE_ADMIN | Toàn bộ quyền hệ thống |
| `manager_dev` | ROLE_MANAGER | Duyệt hồ sơ + xem/xuất báo cáo |

> Dev mode: mã OTP hiển thị trong response của `/auth/login` và console log backend.

## Tiến độ

- [x] Phase 0 — DB scripts + tài liệu
- [x] Phase 1 — Xác thực & Security (JWT + OTP)
- [x] Phase 2 — Dữ liệu biến động (+ Import Excel)
- [x] Phase 3 — Phê duyệt hồ sơ
- [x] Phase 4 — Báo cáo & xuất file
- [x] Phase 5 — RBAC quản lý tài khoản
- [ ] Phase 6 — CMS + Audit Log
