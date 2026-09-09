package com.bank.admin.approval;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Mock client gọi hệ thống bên ngoài sau khi xử lý hồ sơ:
 *  - Core Banking: cập nhật hạn mức/trạng thái hồ sơ về lõi ngân hàng.
 *  - SMS/Email: thông báo kết quả cho khách hàng.
 * Thực tế sẽ thay bằng REST/Feign call - hiện tại chỉ log có cấu trúc.
 */
@Slf4j
@Component
public class NotificationClient {

    /** Gọi Core Banking API (mock). */
    public void notifyCoreBanking(Application app, ApplicationApproval.Action action) {
        log.info("[CORE-BANKING] POST /api/core/applications/{}/status -> {} (hồ sơ {}, KH {})",
            app.getApplicationCode(), action, app.getId(),
            app.getCustomer().getFullName());
    }

    /** Gửi Email + SMS thông báo kết quả cho khách hàng (mock). */
    public void notifyCustomer(Application app, ApplicationApproval.Action action, String reasonNote) {
        String phone = app.getCustomer().getPhoneNumber();
        String email = app.getCustomer().getEmail();
        String message = switch (action) {
            case APPROVED -> "Hồ sơ " + app.getApplicationCode() + " của bạn đã được DUYỆT.";
            case REJECTED -> "Hồ sơ " + app.getApplicationCode() + " của bạn không được phê duyệt.";
            case REQUEST_DOCS -> "Hồ sơ " + app.getApplicationCode() + " cần bổ sung giấy tờ: "
                + (reasonNote == null ? "" : reasonNote);
        };
        if (email != null && !email.isBlank()) {
            log.info("[EMAIL] to={} | {}", email, message);
        }
        log.info("[SMS] to={} | {}", phone, message);
    }
}
