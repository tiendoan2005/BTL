package com.bank.admin.config;

import com.bank.admin.user.Permission;
import com.bank.admin.user.PermissionRepository;
import com.bank.admin.user.Role;
import com.bank.admin.user.RoleRepository;
import com.bank.admin.user.User;
import com.bank.admin.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;

/**
 * Đảm bảo tài khoản demo đăng nhập được ở môi trường dev.
 * - Tạo thiếu: roles/permissions/users khớp db/data.sql.
 * - Reset mật khẩu 2 tài khoản demo về giá trị biết trước (data.sql dùng bcrypt mẫu không thể kiểm tra).
 * Tắt bằng app.seed.demo-data=false.
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class DemoDataSeeder {

    private static final Map<String, String> PERMISSIONS = Map.of(
        "SYS_MANAGE_USERS", "Tạo và phân quyền tài khoản",
        "DATA_UPDATE_RATES", "Cập nhật tỷ giá & lãi suất",
        "APPROVE_LOAN", "Phê duyệt hồ sơ vay & mở thẻ",
        "REPORT_EXPORT", "Xem và xuất file báo cáo",
        "CMS_MANAGE_POST", "Thêm mới và sửa bài viết",
        "STAFF_CUSTOMER_ADVISORY", "Tư vấn và quản lý khách hàng",
        "STAFF_SUPPORT_TICKET", "Tiếp nhận và hỗ trợ CSKH",
        "STAFF_DISPUTE_HANDLE", "Xử lý yêu cầu tra soát",
        "STAFF_FINANCIAL_TX", "Thực hiện giao dịch tài chính");

    @Bean
    ApplicationRunner seedDemoData(UserRepository userRepository,
                                   RoleRepository roleRepository,
                                   PermissionRepository permissionRepository,
                                   com.bank.admin.staff.ChatbotAppointmentRepository appointmentRepository,
                                   org.springframework.jdbc.core.JdbcTemplate jdbcTemplate,
                                   PasswordEncoder passwordEncoder,
                                   @org.springframework.beans.factory.annotation.Value("${app.security.otp-dev-mode}") boolean otpDevMode,
                                   @org.springframework.beans.factory.annotation.Value("${app.seed.demo-data}") boolean enabled) {
        return args -> {
            if (!enabled) {
                log.info("Demo data seeding disabled");
                return;
            }

            // Permissions
            Map<String, Permission> perms = new java.util.HashMap<>();
            PERMISSIONS.forEach((code, name) -> {
                Permission p = permissionRepository.findByCode(code).orElseGet(() ->
                    permissionRepository.save(Permission.builder()
                        .code(code).name(name).moduleName(moduleOf(code)).build()));
                perms.put(code, p);
            });

            // Roles
            Role admin = roleRepository.findByCode("ROLE_ADMIN").orElseGet(() ->
                roleRepository.save(Role.builder().code("ROLE_ADMIN")
                    .name("Quản trị hệ thống").description("Có toàn bộ quyền trong hệ thống").build()));
            admin.setPermissions(new java.util.LinkedHashSet<>(perms.values()));

            Role manager = roleRepository.findByCode("ROLE_MANAGER").orElseGet(() ->
                roleRepository.save(Role.builder().code("ROLE_MANAGER")
                    .name("Quản lý phê duyệt").description("Duyệt hồ sơ, hạn mức và xem báo cáo").build()));
            manager.setPermissions(new java.util.LinkedHashSet<>(java.util.List.of(
                perms.get("APPROVE_LOAN"), perms.get("REPORT_EXPORT"), perms.get("STAFF_FINANCIAL_TX"))));

            Role staff = roleRepository.findByCode("ROLE_STAFF").orElseGet(() ->
                roleRepository.save(Role.builder().code("ROLE_STAFF")
                    .name("Nhân viên nghiệp vụ").description("Thực hiện tư vấn, tra soát, hỗ trợ và giao dịch tài chính").build()));
            staff.setPermissions(new java.util.LinkedHashSet<>(java.util.List.of(
                perms.get("STAFF_CUSTOMER_ADVISORY"),
                perms.get("STAFF_SUPPORT_TICKET"),
                perms.get("STAFF_DISPUTE_HANDLE"),
                perms.get("STAFF_FINANCIAL_TX"))));

            roleRepository.saveAll(java.util.List.of(admin, manager, staff));

            // Users demo - mật khẩu dev cố định để tiện chấm bài/demo
            ensureUser(userRepository, passwordEncoder, "admin_super", "Admin@123",
                "admin@bank.com", "Nguyễn Văn Admin", "0901234567", admin);
            ensureUser(userRepository, passwordEncoder, "manager_dev", "Manager@123",
                "manager@bank.com", "Trần Thị Duyệt", "0912345678", manager);
            ensureUser(userRepository, passwordEncoder, "ql_minhtuan", "Manager@123",
                "tuan.ql@bank.com", "Lê Minh Tuấn", "0918999888", manager);
            ensureUser(userRepository, passwordEncoder, "nv_hoangnam", "Staff@123",
                "nam.nv@bank.com", "Nguyễn Hoàng Nam", "0933444555", staff);

            // Đảm bảo bảng chatbot_appointments tồn tại trước khi thao tác
            try {
                jdbcTemplate.execute("""
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
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """);
            } catch (Exception ex) {
                log.warn("Không thể tự động tạo bảng chatbot_appointments qua JDBC: {}", ex.getMessage());
            }

            // Dữ liệu mẫu Lịch hẹn Chatbot cho Giao dịch viên
            try {
                if (appointmentRepository.count() == 0) {
                    appointmentRepository.saveAll(java.util.List.of(
                        com.bank.admin.staff.ChatbotAppointment.builder()
                            .appointmentCode("VCB-APT-2026-10001")
                            .fullName("Nguyễn Văn Tuấn")
                            .phoneNumber("0912345678")
                            .email("tuan.nguyen@gmail.com")
                            .branchName("Chi nhánh Vietcombank Hoàn Kiếm")
                            .serviceType("Đăng ký Gói vay mua nhà an cư")
                            .appointmentDate(java.time.LocalDate.now().plusDays(2))
                            .timeSlot("09:00 - 10:00")
                            .note("Cần tư vấn lãi suất ưu đãi cố định 2 năm đầu")
                            .status(com.bank.admin.staff.ChatbotAppointment.Status.PENDING)
                            .build(),
                        com.bank.admin.staff.ChatbotAppointment.builder()
                            .appointmentCode("VCB-APT-2026-10002")
                            .fullName("Trần Thị Thu Hà")
                            .phoneNumber("0987654321")
                            .email("thuha.tran@outlook.com")
                            .branchName("Chi nhánh Vietcombank Ba Đình")
                            .serviceType("Mở tài khoản thanh toán số đẹp & Thẻ Visa")
                            .appointmentDate(java.time.LocalDate.now().plusDays(1))
                            .timeSlot("10:30 - 11:30")
                            .note("Muốn chọn đuôi số tài khoản tứ quý 8888")
                            .status(com.bank.admin.staff.ChatbotAppointment.Status.CONFIRMED)
                            .handledBy("Nguyễn Hoàng Nam")
                            .handlerNote("Đã gọi điện xác nhận và chuẩn bị sẵn biểu mẫu")
                            .build(),
                        com.bank.admin.staff.ChatbotAppointment.builder()
                            .appointmentCode("VCB-APT-2026-10003")
                            .fullName("Lê Hoàng Nam")
                            .phoneNumber("0933112233")
                            .email("nam.le@gmail.com")
                            .branchName("Chi nhánh Vietcombank Sở Giao dịch")
                            .serviceType("Tư vấn Tiết kiệm lãi suất bậc thang")
                            .appointmentDate(java.time.LocalDate.now())
                            .timeSlot("14:00 - 15:00")
                            .note("Gửi tiết kiệm 1 tỷ đồng")
                            .status(com.bank.admin.staff.ChatbotAppointment.Status.COMPLETED)
                            .handledBy("Nguyễn Hoàng Nam")
                            .handlerNote("Khách hàng đã hoàn tất mở sổ tiết kiệm tại quầy 03")
                            .build(),
                        com.bank.admin.staff.ChatbotAppointment.builder()
                            .appointmentCode("VCB-APT-2026-10004")
                            .fullName("Công ty Cổ phần VinaTech")
                            .phoneNumber("0243888999")
                            .email("contact@vinatech.vn")
                            .branchName("Chi nhánh Vietcombank Cầu Giấy")
                            .serviceType("Tín dụng Doanh nghiệp & Phát hành L/C")
                            .appointmentDate(java.time.LocalDate.now().plusDays(3))
                            .timeSlot("15:00 - 16:00")
                            .note("Hạn mức tín dụng xuất nhập khẩu 15 tỷ VND")
                            .status(com.bank.admin.staff.ChatbotAppointment.Status.PENDING)
                            .build(),
                        com.bank.admin.staff.ChatbotAppointment.builder()
                            .appointmentCode("VCB-APT-2026-10005")
                            .fullName("Phạm Quốc Cường")
                            .phoneNumber("0905123987")
                            .email("cuong.pham@yahoo.com")
                            .branchName("Chi nhánh Vietcombank Đống Đa")
                            .serviceType("Nhận tiền kiều hối Western Union")
                            .appointmentDate(java.time.LocalDate.now().minusDays(1))
                            .timeSlot("08:30 - 09:30")
                            .note("Nhận tiền từ người thân tại Hoa Kỳ")
                            .status(com.bank.admin.staff.ChatbotAppointment.Status.CANCELLED)
                            .handledBy("Nguyễn Hoàng Nam")
                            .handlerNote("Khách hàng bận đột xuất, đã hỗ trợ hướng dẫn nhận qua Digibank")
                            .build()
                    ));
                }
            } catch (Exception ex) {
                log.warn("Không thể khởi tạo dữ liệu mẫu lịch hẹn: {}", ex.getMessage());
            }

            log.info("Demo data ready. Dev accounts: admin_super/Admin@123, ql_minhtuan/Manager@123, nv_hoangnam/Staff@123 (otpDevMode={})", otpDevMode);
        };
    }

    private void ensureUser(UserRepository userRepository, PasswordEncoder encoder,
                            String username, String rawPassword, String email,
                            String fullName, String phone, Role role) {
        String encodedPass = encoder.encode(rawPassword);
        User user = userRepository.findByUsernameWithRoles(username)
            .orElseGet(() -> userRepository.save(User.builder()
                .username(username)
                .passwordHash(encodedPass)
                .email(email)
                .fullName(fullName)
                .phoneNumber(phone)
                .status(User.Status.ACTIVE)
                .build()));
        // Luôn đồng bộ mật khẩu + vai trò cho tài khoản demo
        user.setPasswordHash(encodedPass);
        user.setStatus(User.Status.ACTIVE);
        user.getRoles().clear();
        user.getRoles().add(role);
        userRepository.save(user);
    }

    private String moduleOf(String code) {
        if (code.startsWith("SYS_")) return "System";
        if (code.startsWith("DATA_")) return "FluctuatingData";
        if (code.startsWith("APPROVE")) return "Approval";
        if (code.startsWith("REPORT")) return "Report";
        if (code.startsWith("STAFF_")) return "StaffModule";
        return "CMS";
    }
}
