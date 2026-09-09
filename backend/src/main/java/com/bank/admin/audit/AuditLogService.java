package com.bank.admin.audit;

import com.bank.admin.common.PagedResponse;
import com.bank.admin.security.SecurityContextUtils;
import com.bank.admin.user.User;
import com.bank.admin.user.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;
import java.util.*;

/**
 * Ghi audit log bất đồng bộ (sau commit) & tra cứu nhật ký hệ thống.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository repository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public void record(String actionType, String moduleName, String description,
                       Object payloadBefore, Object payloadAfter) {
        try {
            AuditLog entry = AuditLog.builder()
                .userId(currentUserIdOrNull())
                .actionType(actionType)
                .moduleName(moduleName)
                .ipAddress(currentIp())
                .userAgent(currentUserAgent())
                .status(AuditLog.Status.SUCCESS)
                .description(description)
                .payloadBefore(toJson(payloadBefore))
                .payloadAfter(toJson(payloadAfter))
                .build();
            repository.save(entry);
        } catch (Exception ex) {
            // Audit log thất bại không được chặn nghiệp vụ chính
            log.error("Ghi audit log thất bại action={}", actionType, ex);
        }
    }

    @Transactional(readOnly = true)
    public PagedResponse<AuditDtos.AuditLogResponse> searchLogs(
        String action, String module, Long userId, Instant from, Instant to, int page, int size) {
        String act = (action == null || action.isBlank()) ? null : action.trim();
        String mod = (module == null || module.isBlank()) ? null : module.trim();
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLog> logPage = repository.search(act, mod, userId, from, to, pageable);

        // Gom userId để nạp tên user 1 lần
        Set<Long> userIds = new HashSet<>();
        for (AuditLog l : logPage.getContent()) {
            if (l.getUserId() != null) userIds.add(l.getUserId());
        }
        Map<Long, User> userMap = new HashMap<>();
        if (!userIds.isEmpty()) {
            for (User u : userRepository.findAllById(userIds)) {
                userMap.put(u.getId(), u);
            }
        }

        List<AuditDtos.AuditLogResponse> content = logPage.getContent().stream().map(l -> {
            User u = l.getUserId() != null ? userMap.get(l.getUserId()) : null;
            String uname = u != null ? u.getUsername() : (l.getUserId() == null ? "SYSTEM / ANONYMOUS" : "#" + l.getUserId());
            String fullName = u != null ? u.getFullName() : null;
            return AuditDtos.AuditLogResponse.from(l, uname, fullName);
        }).toList();

        return new PagedResponse<>(content, logPage.getNumber(), logPage.getSize(),
            logPage.getTotalElements(), logPage.getTotalPages());
    }

    private Long currentUserIdOrNull() {
        try {
            return SecurityContextUtils.currentUserId();
        } catch (Exception e) {
            return null; // action hệ thống / đăng nhập thất bại
        }
    }

    private String currentIp() {
        ServletRequestAttributes attrs = (ServletRequestAttributes)
            RequestContextHolder.getRequestAttributes();
        if (attrs == null) return null;
        HttpServletRequest req = attrs.getRequest();
        String fwd = req.getHeader("X-Forwarded-For");
        return fwd != null && !fwd.isBlank() ? fwd.split(",")[0].trim() : req.getRemoteAddr();
    }

    private String currentUserAgent() {
        ServletRequestAttributes attrs = (ServletRequestAttributes)
            RequestContextHolder.getRequestAttributes();
        return attrs != null ? attrs.getRequest().getHeader("User-Agent") : null;
    }

    private String toJson(Object payload) {
        if (payload == null) return null;
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            return String.valueOf(payload);
        }
    }
}
