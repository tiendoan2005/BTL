package com.bank.admin.security;

import com.bank.admin.common.ApiException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Temp token ngắn hạn (5 phút) dùng giữa bước 1 và bước 2 của đăng nhập.
 * Lưu in-memory: đủ cho demo/dev; prod nên thay bằng Redis với TTL.
 */
@Service
public class TemporaryTokenService {

    private static final long TTL_MILLIS = 5 * 60_000L;

    private record Entry(Long userId, Instant expiresAt) {
        boolean expired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    private final Map<String, Entry> store = new ConcurrentHashMap<>();

    /** Phát hành temp token cho user sau khi password đúng. */
    public String issue(Long userId) {
        // Token ngẫu nhiên 32 ký tự hex
        String token = Long.toHexString(System.nanoTime()) + Long.toHexString(Double.doubleToLongBits(Math.random()));
        store.put(token, new Entry(userId, Instant.now().plusMillis(TTL_MILLIS)));
        return token;
    }

    /** Trả về userId nếu token hợp lệ, ngược lại ném 401. */
    public Long consume(String token) {
        Entry entry = store.get(token);
        if (entry == null || entry.expired()) {
            store.remove(token);
            throw ApiException.unauthorized("Phiên xác thực OTP không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.");
        }
        return entry.userId();
    }

    /** Dùng cho resend-otp: kiểm tra nhưng KHÔNG tiêu hao token. */
    public Long peek(String token) {
        Entry entry = store.get(token);
        if (entry == null || entry.expired()) {
            store.remove(token);
            throw ApiException.unauthorized("Phiên xác thực OTP không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.");
        }
        return entry.userId();
    }
}
