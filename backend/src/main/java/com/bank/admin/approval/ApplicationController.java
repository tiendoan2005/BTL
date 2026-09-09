package com.bank.admin.approval;

import com.bank.admin.approval.dto.ApprovalDtos.ApplicationDetailResponse;
import com.bank.admin.approval.dto.ApprovalDtos.ApplicationListResponse;
import com.bank.admin.approval.dto.ApprovalDtos.DecisionRequest;
import com.bank.admin.common.ApiResponse;
import com.bank.admin.common.PagedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** API tra cứu + xử lý hồ sơ. Quyền APPROVE_LOAN. */
@Tag(name = "Phê duyệt hồ sơ")
@RestController
@RequestMapping("/api/v1/applications")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('APPROVE_LOAN')")
public class ApplicationController {

    private final ApplicationService service;

    @Operation(summary = "Danh sách hồ sơ (filter keyword/type/status)")
    @GetMapping
    public ApiResponse<PagedResponse<ApplicationListResponse>> list(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String type,
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(service.search(keyword, type, status, page, size));
    }

    @Operation(summary = "Chi tiết hồ sơ (khách hàng + chứng từ + lịch sử)")
    @GetMapping("/{id}")
    public ApiResponse<ApplicationDetailResponse> detail(@PathVariable Long id) {
        return ApiResponse.ok(service.getDetail(id));
    }

    @Operation(summary = "Xử lý hồ sơ: APPROVED / REJECTED / REQUEST_DOCS")
    @PostMapping("/{id}/decision")
    public ApiResponse<ApplicationDetailResponse> decide(@PathVariable Long id,
                                                         @Valid @RequestBody DecisionRequest req) {
        return ApiResponse.ok("Đã xử lý hồ sơ", service.decide(id, req));
    }
}
