package com.bank.admin.auth;

import com.bank.admin.auth.dto.AuthDtos.AuthResponse;
import com.bank.admin.auth.dto.AuthDtos.ChangePasswordRequest;
import com.bank.admin.auth.dto.AuthDtos.LoginRequest;
import com.bank.admin.auth.dto.AuthDtos.LoginStep1Response;
import com.bank.admin.common.ApiException;
import com.bank.admin.security.JwtService;
import com.bank.admin.security.OtpService;
import com.bank.admin.security.TemporaryTokenService;
import com.bank.admin.security.UserPrincipal;
import com.bank.admin.user.User;
import com.bank.admin.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OtpService otpService;
    private final TemporaryTokenService tempTokenService;

    /**
     * BƯỚC 1: kiểm tra username/password, phát hành temp token + OTP.
     * Trả về devOtp chỉ khi otp-dev-mode bật (test không cần SMTP).
     */
    @Transactional
    public LoginStep1Response login(LoginRequest request) {
        User user = userRepository.findByUsernameWithRoles(request.username())
            .orElseThrow(() -> new BadCredentialsException("invalid"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("invalid");
        }
        if (!user.isActive()) {
            throw ApiException.forbidden("Tài khoản đã bị khóa hoặc vô hiệu hóa. Liên hệ quản trị viên.");
        }

        String tempToken = tempTokenService.issue(user.getId());
        String devOtp = otpService.issueOtp(user);

        return LoginStep1Response.builder()
            .username(user.getUsername())
            .tempToken(tempToken)
            .devOtp(devOtp)
            .maskedEmail(mask(user.getEmail()))
            .maskedPhone(maskPhone(user.getPhoneNumber()))
            .build();
    }

    /**
     * BƯỚC 2: xác thực OTP -> cấp access + refresh token, cập nhật last_login.
     */
    @Transactional
    public AuthResponse verifyOtp(String username, String tempToken, String otpCode) {
        Long userId = tempTokenService.consume(tempToken);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> ApiException.unauthorized("Phiên đăng nhập không còn hiệu lực"));

        // Temp token phải khớp đúng user đã đăng nhập bước 1
        if (!user.getUsername().equals(username)) {
            throw ApiException.unauthorized("Thông tin xác thực không khớp");
        }
        otpService.verifyOtp(user, otpCode);

        user.setLastLogin(java.time.Instant.now());
        userRepository.save(user);

        return buildAuthResponse(user);
    }

    /** Gửi lại OTP cho cùng một phiên temp token. */
    @Transactional
    public LoginStep1Response resendOtp(String username, String tempToken) {
        Long userId = tempTokenService.peek(tempToken);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> ApiException.unauthorized("Phiên đăng nhập không còn hiệu lực"));
        if (!user.getUsername().equals(username)) {
            throw ApiException.unauthorized("Thông tin xác thực không khớp");
        }
        String devOtp = otpService.issueOtp(user);
        return LoginStep1Response.builder()
            .username(user.getUsername())
            .tempToken(tempToken)
            .devOtp(devOtp)
            .maskedEmail(mask(user.getEmail()))
            .maskedPhone(maskPhone(user.getPhoneNumber()))
            .build();
    }

    /** Đổi refresh token (type=refresh) lấy cặp token mới; quyền được reload từ DB. */
    @Transactional(readOnly = true)
    public AuthResponse refresh(String refreshToken) {
        if (!jwtService.isValid(refreshToken, JwtService.TYPE_REFRESH)) {
            throw ApiException.unauthorized("Refresh token không hợp lệ hoặc đã hết hạn");
        }
        String username = jwtService.extractUsername(refreshToken);
        User user = userRepository.findByUsernameWithRoles(username)
            .orElseThrow(() -> ApiException.unauthorized("Tài khoản không tồn tại"));
        if (!user.isActive()) {
            throw ApiException.forbidden("Tài khoản đã bị khóa hoặc vô hiệu hóa");
        }
        return buildAuthResponse(user);
    }

    /** Vô hiệu hoá phía client (stateless JWT): FE xoá token; BE chỉ log vết. */
    public void logout(String username) {
        log.info("[AUTH] logout: {}", username);
    }

    /** Đổi mật khẩu của chính user đang đăng nhập. */
    @Transactional
    public void changePassword(UserPrincipal principal, ChangePasswordRequest request) {
        User user = userRepository.findByUsernameWithRoles(principal.getUsername())
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy tài khoản"));
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw ApiException.badRequest("Mật khẩu hiện tại không đúng");
        }
        if (request.newPassword().length() < 8) {
            throw ApiException.badRequest("Mật khẩu mới tối thiểu 8 ký tự");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    // ---------- helpers ----------

    private AuthResponse buildAuthResponse(User user) {
        UserPrincipal principal = new UserPrincipal(user);
        var userInfo = AuthResponse.UserInfo.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .roles(user.getRoles().stream().map(r -> r.getCode()).sorted().toList())
            .permissions(principal.getAuthoritiesString().isEmpty()
                ? java.util.List.of()
                : java.util.Arrays.asList(principal.getAuthoritiesString().split(",")))
            .build();

        return AuthResponse.builder()
            .accessToken(jwtService.generateAccessToken(principal))
            .refreshToken(jwtService.generateRefreshToken(principal))
            .expiresInMinutes(30) // đồng bộ với app.jwt.access-expiration-minutes
            .user(userInfo)
            .build();
    }

    private String mask(String value) {
        if (value == null || value.isBlank()) return null;
        int at = value.indexOf('@');
        if (at > 0) {
            return value.charAt(0) + "***" + value.substring(at);
        }
        return maskPhone(value);
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) return null;
        return "***" + phone.substring(phone.length() - 3);
    }
}
