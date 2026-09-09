package com.bank.admin.approval.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** DTO của module Phê duyệt hồ sơ. */
public final class ApprovalDtos {

    private ApprovalDtos() {}

    // ---------- Response ----------

    @Getter
    @Builder
    public static class ApplicationListResponse {
        private Long id;
        private String applicationCode;
        private String customerName;
        private String customerIdCard;
        private String type;
        private BigDecimal requestedAmount;
        private String status;
        private Instant createdAt;
        private Instant updatedAt;
    }

    @Getter
    @Builder
    public static class ApplicationDetailResponse {
        private Long id;
        private String applicationCode;
        private String type;
        private BigDecimal requestedAmount;
        private String status;
        private Instant createdAt;
        private Instant updatedAt;
        private CustomerInfo customer;
        private List<DocumentInfo> documents;
        private List<ApprovalHistory> approvals;
    }

    @Getter
    @Builder
    public static class CustomerInfo {
        private Long id;
        private String fullName;
        private String idCardNumber;
        private String phoneNumber;
        private String email;
    }

    @Getter
    @Builder
    public static class DocumentInfo {
        private Long id;
        private String documentName;
        private String fileUrl;
        private Instant uploadedAt;
    }

    @Getter
    @Builder
    public static class ApprovalHistory {
        private Long id;
        private String action;
        private String reasonNote;
        private String managerName;
        private Instant processedAt;
    }

    // ---------- Request ----------

    /** Quyết định xử lý hồ sơ: APPROVED / REJECTED / REQUEST_DOCS. */
    public record DecisionRequest(
        @NotNull(message = "Vui lòng chọn quyết định") String action,
        @Size(max = 2000, message = "Ghi chú tối đa 2000 ký tự") String reasonNote) {}
}
