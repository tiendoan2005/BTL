package com.bank.admin.security;

import com.bank.admin.common.ApiException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/** Tiện ích lấy user / customer hiện tại từ SecurityContext. */
public final class SecurityContextUtils {

    private SecurityContextUtils() {}

    /** Trả về UserPrincipal của user nội bộ đang đăng nhập, hoặc ném 401. */
    public static UserPrincipal currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            return principal;
        }
        throw ApiException.unauthorized("Chưa đăng nhập hoặc phiên cán bộ quản trị đã hết hạn");
    }

    public static Long currentUserId() {
        return currentUser().getId();
    }

    /** Trả về CustomerPrincipal của khách hàng đang đăng nhập Customer Portal. */
    public static CustomerPrincipal currentCustomer() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomerPrincipal principal) {
            return principal;
        }
        throw ApiException.unauthorized("Chưa đăng nhập hoặc phiên khách hàng đã hết hạn");
    }

    public static Long currentCustomerId() {
        return currentCustomer().getCustomerId();
    }
}
