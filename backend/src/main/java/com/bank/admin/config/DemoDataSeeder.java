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

            log.info("Demo data ready. Dev accounts: admin_super/Admin@123, manager_dev/Manager@123, nv_hoangnam/Staff@123 (otpDevMode={})", otpDevMode);
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
