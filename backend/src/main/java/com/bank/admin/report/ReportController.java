package com.bank.admin.report;

import com.bank.admin.audit.Audited;
import com.bank.admin.common.ApiResponse;
import com.bank.admin.common.PagedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

/** API báo cáo & thống kê: dashboard + xuất file + lịch sử xuất. Quyền REPORT_EXPORT. */
@Tag(name = "Báo cáo & thống kê")
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('REPORT_EXPORT')")
public class ReportController {

    private final ReportService reportService;
    private final ReportExportFacade exportFacade;

    @Operation(summary = "Dashboard thống kê hồ sơ + xu hướng tỷ giá")
    @GetMapping("/dashboard")
    public ApiResponse<ReportDtos.DashboardResponse> dashboard(
        @RequestParam(required = false) LocalDate from,
        @RequestParam(required = false) LocalDate to,
        @RequestParam(required = false) String type) {
        return ApiResponse.ok(reportService.dashboard(from, to, type));
    }

    @Operation(summary = "Xuất file báo cáo (format=EXCEL|PDF|CSV) - trả về link tải")
    @PostMapping("/export")
    public ResponseEntity<ApiResponse<Map<String, String>>> export(
        @RequestParam(defaultValue = "EXCEL") String format,
        @RequestParam(required = false) LocalDate from,
        @RequestParam(required = false) LocalDate to,
        @RequestParam(required = false) String type) {
        Map<String, String> result = exportFacade.export(format, from, to, type);
        return ResponseEntity.status(201).body(ApiResponse.ok("Đã tạo file báo cáo", result));
    }

    @Operation(summary = "Lịch sử xuất báo cáo của user hiện tại")
    @GetMapping("/history")
    public ApiResponse<PagedResponse<ReportExport>> history(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(exportFacade.history(page, size));
    }
}
