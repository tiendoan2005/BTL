package com.bank.admin.approval;

import com.bank.admin.audit.Audited;
import com.bank.admin.common.ApiException;
import com.bank.admin.common.PagedResponse;
import com.bank.admin.approval.dto.ApprovalDtos;
import com.bank.admin.approval.dto.ApprovalDtos.ApprovalHistory;
import com.bank.admin.approval.dto.ApprovalDtos.ApplicationDetailResponse;
import com.bank.admin.approval.dto.ApprovalDtos.ApplicationListResponse;
import com.bank.admin.approval.dto.ApprovalDtos.DecisionRequest;
import com.bank.admin.security.SecurityContextUtils;
import com.bank.admin.user.User;
import com.bank.admin.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Nghiệp vụ tra cứu + xử lý hồ sơ.
 * Quyết định chỉ áp dụng cho hồ sơ PENDING hoặc DOCS_REQUIRED.
 */
@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepo;
    private final ApplicationDocumentRepository documentRepo;
    private final ApplicationApprovalRepository approvalRepo;
    private final UserRepository userRepository;
    private final NotificationClient notificationClient;

    private static final String MODULE = "APPROVAL";

    @Transactional(readOnly = true)
    public PagedResponse<ApplicationListResponse> search(String keyword, String type, String status,
                                                         int page, int size) {
        Page<Application> result = applicationRepo.search(
            blankToNull(keyword),
            parseEnumOrNull(Application.Type.class, type),
            parseEnumOrNull(Application.Status.class, status),
            PageRequest.of(page, size));
        return new PagedResponse<>(result.map(this::toListDto).getContent(),
            result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    @Transactional(readOnly = true)
    public ApplicationDetailResponse getDetail(Long id) {
        Application app = applicationRepo.findById(id)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy hồ sơ có mã " + id));
        return toDetailDto(app);
    }

    /**
     * Xử lý hồ sơ: APPROVED / REJECTED / REQUEST_DOCS.
     * - Chỉ cho xử lý khi trạng thái là PENDING hoặc DOCS_REQUIRED.
     * - REJECTED và REQUEST_DOCS bắt buộc ghi lý do.
     * - Sau quyết định: mock gọi Core Banking + gửi Email/SMS.
     */
    @Transactional
    @Audited(action = "PROCESS_APPLICATION", module = "APPROVAL", description = "Xử lý phê duyệt hồ sơ")
    public ApplicationDetailResponse decide(Long id, DecisionRequest req) {
        ApplicationApproval.Action action = parseAction(req.action());

        Application app = applicationRepo.findById(id)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy hồ sơ có mã " + id));

        if (app.getStatus() != Application.Status.PENDING
                && app.getStatus() != Application.Status.DOCS_REQUIRED) {
            throw ApiException.badRequest("Hồ sơ đã kết thúc (" + app.getStatus()
                + "), không thể xử lý tiếp");
        }
        if ((action == ApplicationApproval.Action.REJECTED
                || action == ApplicationApproval.Action.REQUEST_DOCS)
                && (req.reasonNote() == null || req.reasonNote().isBlank())) {
            throw ApiException.badRequest("Vui lòng nhập lý do cho quyết định "
                + (action == ApplicationApproval.Action.REJECTED ? "từ chối" : "yêu cầu bổ sung giấy tờ"));
        }

        User manager = userRepository.getReferenceById(SecurityContextUtils.currentUserId());
        ApplicationApproval approval = approvalRepo.save(ApplicationApproval.builder()
            .application(app)
            .manager(manager)
            .action(action)
            .reasonNote(req.reasonNote())
            .build());

        // Cập nhật trạng thái hồ sơ theo quyết định
        app.setStatus(switch (action) {
            case APPROVED -> Application.Status.APPROVED;
            case REJECTED -> Application.Status.REJECTED;
            case REQUEST_DOCS -> Application.Status.DOCS_REQUIRED;
        });
        applicationRepo.save(app);

        // Thông báo hệ thống bên ngoài (mock: log ra console)
        notificationClient.notifyCoreBanking(app, action);
        notificationClient.notifyCustomer(app, action, req.reasonNote());

        return toDetailDto(app);
    }

    // ==================== helpers ====================

    private ApplicationApproval.Action parseAction(String action) {
        try {
            return ApplicationApproval.Action.valueOf(action);
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Quyết định không hợp lệ: " + action
                + " (chấp nhận APPROVED, REJECTED, REQUEST_DOCS)");
        }
    }

    private ApplicationListResponse toListDto(Application a) {
        return ApplicationListResponse.builder()
            .id(a.getId())
            .applicationCode(a.getApplicationCode())
            .customerName(a.getCustomer().getFullName())
            .customerIdCard(a.getCustomer().getIdCardNumber())
            .type(a.getType().name())
            .requestedAmount(a.getRequestedAmount())
            .status(a.getStatus().name())
            .createdAt(a.getCreatedAt())
            .updatedAt(a.getUpdatedAt())
            .build();
    }

    private ApplicationDetailResponse toDetailDto(Application a) {
        return ApplicationDetailResponse.builder()
            .id(a.getId())
            .applicationCode(a.getApplicationCode())
            .type(a.getType().name())
            .requestedAmount(a.getRequestedAmount())
            .status(a.getStatus().name())
            .createdAt(a.getCreatedAt())
            .updatedAt(a.getUpdatedAt())
            .customer(ApprovalDtos.CustomerInfo.builder()
                .id(a.getCustomer().getId())
                .fullName(a.getCustomer().getFullName())
                .idCardNumber(a.getCustomer().getIdCardNumber())
                .phoneNumber(a.getCustomer().getPhoneNumber())
                .email(a.getCustomer().getEmail())
                .build())
            .documents(documentRepo.findByApplicationIdOrderByUploadedAtAsc(a.getId()).stream()
                .map(d -> ApprovalDtos.DocumentInfo.builder()
                    .id(d.getId()).documentName(d.getDocumentName())
                    .fileUrl(d.getFileUrl()).uploadedAt(d.getUploadedAt()).build())
                .toList())
            .approvals(approvalRepo.findByApplicationIdWithManager(a.getId()).stream()
                .map(ap -> ApprovalHistory.builder()
                    .id(ap.getId()).action(ap.getAction().name())
                    .reasonNote(ap.getReasonNote())
                    .managerName(ap.getManager().getFullName())
                    .processedAt(ap.getProcessedAt()).build())
                .toList())
            .build();
    }

    private String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private <E extends Enum<E>> E parseEnumOrNull(Class<E> enumClass, String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return Enum.valueOf(enumClass, value);
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Giá trị lọc không hợp lệ: " + value);
        }
    }
}
