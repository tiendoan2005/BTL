package com.bank.admin.security;

import com.bank.admin.common.ApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

/**
 * Sinh và xác thực mã OTP bước 2 của đăng nhập.
 * Dev mode (otp-dev-mode=true): OTP được log ra console và trả về client để tiện test.
 * Prod: thay phần "gửi đi" bằng SMTP/SMS gateway thật.
 */
@Slf4j
@Service
public class OtpService {

    private static final int OTP_LENGTH = 6;
    private static final int VALID_MINUTES = 5;
    private static final int MAX_VERIFY_ATTEMPTS_HINT = 5;

    private final SecureRandom random = new SecureRandom();
    private final boolean devMode;

    public OtpService(@Value("${app.security.otp-dev-mode}") boolean devMode) {
        this.devMode = devMode;
    }

    /** Sinh mã mới, lưu vào user, "gửi" đi và trả về chuỗi OTP nếu đang bật dev mode. */
    public String issueOtp(com.bank.admin.user.User user) {
        String code = String.format("%0" + OTP_LENGTH + "d", random.nextInt((int) Math.pow(10, OTP_LENGTH)));
        user.setOtpSecret(code);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(VALID_MINUTES));
        sendOtp(user, code);
        return devMode ? code : null;
    }

    /** Xác thực OTP của user; sai/hết hạn -> 401 với message rõ ràng. */
    public void verifyOtp(com.bank.admin.user.User user, String submittedCode) {
        if (user.getOtpSecret() == null || user.getOtpExpiry() == null) {
            throw ApiException.unauthorized("Chưa có mã OTP nào được cấp. Vui lòng đăng nhập lại.");
        }
        if (LocalDateTime.now().isAfter(user.getOtpExpiry())) {
            clearOtp(user);
            throw ApiException.unauthorized("Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã.");
        }
        if (!user.getOtpSecret().equals(submittedCode)) {
            throw ApiException.unauthorized("Mã OTP không đúng.");
        }
        // Hợp lệ -> tiêu hao ngay, chống replay
        clearOtp(user);
    }

    private void clearOtp(com.bank.admin.user.User user) {
        user.setOtpSecret(null);
        user.setOtpExpiry(null);
    }

    /**
     * Điểm tích hợp gateway thật ở prod.
     * Hiện tại: log console + dev mode trả OTP trong response.
     */
    private void sendOtp(com.bank.admin.user.User user, String code) {
        log.info("[OTP] Gửi mã {} tới user {} (email={}, phone={})",
            code, user.getUsername(), user.getEmail(), user.getPhoneNumber());
    }
}
