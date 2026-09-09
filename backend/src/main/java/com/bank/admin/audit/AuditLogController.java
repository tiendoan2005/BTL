package com.bank.admin.audit;

import com.bank.admin.common.ApiResponse;
import com.bank.admin.common.PagedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

/**
 * Controller tra cứu Nhật ký hoạt động hệ thống (Audit Logs) (Module 6 / System).
 */
@RestController
@RequestMapping("/api/v1/system/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('SYS_MANAGE_USERS')")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ApiResponse<PagedResponse<AuditDtos.AuditLogResponse>> searchLogs(
        @RequestParam(required = false) String action,
        @RequestParam(required = false) String module,
        @RequestParam(required = false) Long userId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(auditLogService.searchLogs(action, module, userId, from, to, page, size));
    }
}
