package com.bank.admin.audit;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

/** DTO cho Audit Logs (Module 6 / System). */
public final class AuditDtos {

    private AuditDtos() {}

    @Getter
    @Builder
    public static class AuditLogResponse {
        private Long id;
        private Long userId;
        private String username;
        private String userFullName;
        private String actionType;
        private String moduleName;
        private String ipAddress;
        private String userAgent;
        private AuditLog.Status status;
        private String description;
        private String payloadBefore;
        private String payloadAfter;
        private Instant createdAt;

        public static AuditLogResponse from(AuditLog log, String username, String userFullName) {
            return AuditLogResponse.builder()
                .id(log.getId())
                .userId(log.getUserId())
                .username(username)
                .userFullName(userFullName)
                .actionType(log.getActionType())
                .moduleName(log.getModuleName())
                .ipAddress(log.getIpAddress())
                .userAgent(log.getUserAgent())
                .status(log.getStatus())
                .description(log.getDescription())
                .payloadBefore(log.getPayloadBefore())
                .payloadAfter(log.getPayloadAfter())
                .createdAt(log.getCreatedAt())
                .build();
        }
    }
}
