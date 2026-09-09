package com.bank.admin.audit;

import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

/**
 * Aspect ghi audit log cho mọi method gắn @Audited.
 * - Ghi sau khi method thành công (payload_after = giá trị trả về).
 * - Method ném exception thì KHÔNG ghi SUCCESS (nghiệp vụ không đổi).
 */
@Aspect
@Component
@RequiredArgsConstructor
public class AuditLogAspect {

    private final AuditLogService auditLogService;

    @Around("@annotation(audited)")
    public Object around(ProceedingJoinPoint pjp, Audited audited) throws Throwable {
        Object result = pjp.proceed();
        try {
            String description = audited.description().isEmpty()
                ? audited.action()
                : audited.description();
            // Với method CRUD trả về entity/DTO: payload_after chính là dữ liệu mới
            Object payloadAfter = (result instanceof org.springframework.http.ResponseEntity<?> re)
                ? re.getBody() : result;
            auditLogService.record(audited.action(), audited.module(), description, null, payloadAfter);
        } catch (Exception ex) {
            // không bao giờ làm hỏng response nghiệp vụ vì lỗi log
        }
        return result;
    }
}
