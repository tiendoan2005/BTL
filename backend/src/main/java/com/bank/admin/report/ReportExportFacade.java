package com.bank.admin.report;

import com.bank.admin.audit.Audited;
import com.bank.admin.common.ApiException;
import com.bank.admin.common.PagedResponse;
import com.bank.admin.security.SecurityContextUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Điều phối xuất file: sinh file (ExportService) + ghi lịch sử report_exports.
 * Tách khỏi ReportController để gắn @Audited ở đúng tầng nghiệp vụ.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReportExportFacade {

    private static final String REPORT_TYPE = "APPLICATION_SUMMARY";

    private final ReportService reportService;
    private final ExportService exportService;
    private final ReportExportRepository exportRepo;

    @Audited(action = "EXPORT_REPORT", module = "REPORT", description = "Xuất báo cáo hồ sơ")
    public Map<String, String> export(String format, LocalDate from, LocalDate to, String type) {
        ReportExport.Format fmt = parseFormat(format);
        var rows = reportService.applicationRows(from, to, type);

        Path file = switch (fmt) {
            case EXCEL -> exportService.exportExcel(rows);
            case PDF -> exportService.exportPdf(rows);
            case CSV -> exportService.exportCsv(rows);
        };

        // Đường dẫn public phục vụ download từ frontend (/uploads/** đã được serve tĩnh)
        String publicPath = "/uploads/reports/" + file.getFileName();
        Map<String, Object> filters = new LinkedHashMap<>();
        if (from != null) filters.put("from", from.toString());
        if (to != null) filters.put("to", to.toString());
        if (type != null && !type.isBlank()) filters.put("type", type);

        ReportExport record = ReportExport.builder()
            .userId(SecurityContextUtils.currentUserId())
            .reportType(REPORT_TYPE)
            .filterParams(toJson(filters))
            .fileFormat(fmt)
            .filePath(publicPath)
            .build();
        exportRepo.save(record);

        log.info("User {} xuất báo cáo {} ({} dòng, {})", record.getUserId(), publicPath,
            rows.size(), fmt);
        return Map.of(
            "downloadUrl", publicPath,
            "format", fmt.name(),
            "rowCount", String.valueOf(rows.size()));
    }

    /** Lịch sử xuất của chính user đang đăng nhập. */
    public PagedResponse<ReportExport> history(int page, int size) {
        var result = exportRepo.findHistory(SecurityContextUtils.currentUserId(),
            PageRequest.of(page, size));
        return PagedResponse.of(result);
    }

    private ReportExport.Format parseFormat(String format) {
        if (format == null || format.isBlank()) return ReportExport.Format.EXCEL;
        try {
            return ReportExport.Format.valueOf(format.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest(
                "Định dạng không hợp lệ: " + format + " (chọn EXCEL, PDF hoặc CSV)");
        }
    }

    /** Serialize bộ lọc thành JSON đơn giản không cần ObjectMapper (giá trị đều an toàn). */
    private String toJson(Map<String, Object> filters) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (var e : filters.entrySet()) {
            if (!first) sb.append(',');
            sb.append('"').append(e.getKey()).append("\":\"").append(e.getValue()).append('"');
            first = false;
        }
        return sb.append('}').toString();
    }
}
