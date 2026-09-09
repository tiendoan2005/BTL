package com.bank.admin.audit;

import java.lang.annotation.*;

/**
 * Đánh dấu method nghiệp vụ cần ghi audit log.
 * AuditLogAspect tự ghi: action, module, mô tả, IP, payload after (giá trị trả về).
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Audited {

    /** Mã hành động, vd CREATE_EXCHANGE_RATE. */
    String action();

    /** Tên module: DATA, APPROVAL, REPORT, SYSTEM, CMS... */
    String module();

    /** Mô tả ngắn hiển thị ở trang Audit Log. */
    String description() default "";
}
