package com.bank.admin.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

/** DTO cho quản lý tài khoản & phân quyền (Module 5 - RBAC). */
public final class UserDtos {

    private UserDtos() {}

    // ---------- Request ----------

    /** Tạo tài khoản mới: username/email trùng -> 409 ở service. */
    public record UserCreateRequest(
        @NotBlank(message = "Tên đăng nhập không được để trống")
        @Size(max = 50)
        @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Tên đăng nhập chỉ gồm chữ, số, dấu chấm và gạch ngang")
        String username,
        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(min = 6, max = 100, message = "Mật khẩu tối thiểu 6 ký tự")
        String password,
        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không đúng định dạng")
        @Size(max = 100)
        String email,
        @NotBlank(message = "Họ tên không được để trống")
        @Size(max = 100)
        String fullName,
        @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
        String phoneNumber,
        Set<Integer> roleIds) {}

    /** Cập nhật: các field null sẽ giữ nguyên; newPassword khác rỗng => reset mật khẩu. */
    public record UserUpdateRequest(
        @NotBlank(message = "Họ tên không được để trống")
        @Size(max = 100)
        String fullName,
        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không đúng định dạng")
        @Size(max = 100)
        String email,
        @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
        String phoneNumber,
        User.Status status,
        Set<Integer> roleIds,
        @Size(min = 6, max = 100, message = "Mật khẩu mới tối thiểu 6 ký tự")
        String newPassword) {}

    /** Tạo/sửa vai trò: kèm danh sách permission được gán. */
    public record RoleRequest(
        @NotBlank(message = "Tên vai trò không được để trống")
        @Size(max = 100)
        String name,
        @Size(max = 500) String description,
        Set<Integer> permissionIds) {}

    // ---------- Response ----------

    @Getter
    @Builder
    public static class UserResponse {
        private Long id;
        private String username;
        private String email;
        private String fullName;
        private String phoneNumber;
        private User.Status status;
        private List<RoleBrief> roles;
        private Instant lastLogin;
        private Instant createdAt;

        @Getter
        @Builder
        public static class RoleBrief {
            private Integer id;
            private String code;
            private String name;
        }

        /** Gọi trong transaction vì roles là LAZY. */
        public static UserResponse from(User u) {
            return UserResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .phoneNumber(u.getPhoneNumber())
                .status(u.getStatus())
                .roles(u.getRoles().stream()
                    .map(r -> RoleBrief.builder().id(r.getId()).code(r.getCode()).name(r.getName()).build())
                    .sorted(Comparator.comparing(RoleBrief::getCode))
                    .toList())
                .lastLogin(u.getLastLogin())
                .createdAt(u.getCreatedAt())
                .build();
        }
    }

    @Getter
    @Builder
    public static class RoleResponse {
        private Integer id;
        private String code;
        private String name;
        private String description;
        private List<PermissionBrief> permissions;
        private long userCount;

        @Getter
        @Builder
        public static class PermissionBrief {
            private Integer id;
            private String code;
        }
    }

    public record PermissionResponse(Integer id, String code, String name, String moduleName) {}
}
