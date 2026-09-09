package com.bank.admin.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Getter;

public final class AuthDtos {

    private AuthDtos() {}

    // ---------- Request ----------

    public record LoginRequest(
        @NotBlank(message = "Tên đăng nhập không được để trống") String username,
        @NotBlank(message = "Mật khẩu không được để trống") String password) {}

    public record VerifyOtpRequest(
        @NotBlank(message = "Tên đăng nhập không được để trống") String username,
        @NotBlank(message = "Vui lòng nhập mã OTP") String tempToken,
        @NotBlank(message = "Vui lòng nhập mã OTP") String otpCode) {}

    public record ResendOtpRequest(
        @NotBlank String username,
        @NotBlank String tempToken) {}

    public record RefreshRequest(@NotBlank String refreshToken) {}

    public record ChangePasswordRequest(
        @NotBlank String currentPassword,
        @NotBlank String newPassword) {}

    // ---------- Response ----------

    /**
     * Kết quả bước 1: chưa cấp JWT, chỉ phát hành temp token ngắn hạn để làm bước OTP.
     */
    @Getter
    @Builder
    public static class LoginStep1Response {
        private String username;
        private String tempToken;
        /** Chỉ khác null khi app.security.otp-dev-mode=true (để test nhanh). */
        private String devOtp;
        private String maskedEmail;   // v***@bank.com - gợi ý nơi nhận OTP
        private String maskedPhone;
    }

    /** Kết quả bước 2 (OTP đúng): cặp access/refresh token + thông tin profile. */
    @Getter
    @Builder
    public static class AuthResponse {
        private String accessToken;
        private String refreshToken;
        private long expiresInMinutes;
        private UserInfo user;

        @Getter
        @Builder
        public static class UserInfo {
            private Long id;
            private String username;
            private String email;
            private String fullName;
            private java.util.List<String> roles;
            private java.util.List<String> permissions;
        }
    }
}
