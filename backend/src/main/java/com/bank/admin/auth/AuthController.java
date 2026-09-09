package com.bank.admin.auth;

import com.bank.admin.auth.dto.AuthDtos.AuthResponse;
import com.bank.admin.auth.dto.AuthDtos.ChangePasswordRequest;
import com.bank.admin.auth.dto.AuthDtos.LoginRequest;
import com.bank.admin.auth.dto.AuthDtos.LoginStep1Response;
import com.bank.admin.auth.dto.AuthDtos.RefreshRequest;
import com.bank.admin.auth.dto.AuthDtos.ResendOtpRequest;
import com.bank.admin.auth.dto.AuthDtos.VerifyOtpRequest;
import com.bank.admin.common.ApiResponse;
import com.bank.admin.security.SecurityContextUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /** Bước 1: username/password -> temp token (+OTP dev). */
    @PostMapping("/login")
    public ApiResponse<LoginStep1Response> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authService.login(request));
    }

    /** Bước 2: OTP -> JWT access/refresh. */
    @PostMapping("/verify-otp")
    public ApiResponse<AuthResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        return ApiResponse.ok("Đăng nhập thành công",
            authService.verifyOtp(request.username(), request.tempToken(), request.otpCode()));
    }

    /** Gửi lại OTP trong cùng phiên temp token. */
    @PostMapping("/resend-otp")
    public ApiResponse<LoginStep1Response> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        return ApiResponse.ok("Đã gửi lại mã OTP", authService.resendOtp(request.username(), request.tempToken()));
    }

    /** Đổi cặp token mới bằng refresh token. */
    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ApiResponse.ok(authService.refresh(request.refreshToken()));
    }

    /** Đăng xuất (FE xoá token; BE log vết). */
    @PostMapping("/logout")
    public ApiResponse<Void> logout() {
        authService.logout(SecurityContextUtils.currentUser().getUsername());
        return ApiResponse.message("Đăng xuất thành công");
    }

    /** Đổi mật khẩu của chính mình. */
    @PutMapping("/change-password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(SecurityContextUtils.currentUser(), request);
        return ApiResponse.message("Đổi mật khẩu thành công");
    }
}
