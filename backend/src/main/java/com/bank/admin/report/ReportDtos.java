package com.bank.admin.report;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

/** DTO thống kê cho dashboard báo cáo. */
public final class ReportDtos {

    private ReportDtos() {}

    /** Tổng quan hồ sơ theo trạng thái trong khoảng filter. */
    @Getter
    @Builder
    public static class StatusStat {
        private String status;
        private long count;
        private BigDecimal totalAmount;
    }

    /** Phân bố hồ sơ theo loại. */
    @Getter
    @Builder
    public static class TypeStat {
        private String type;
        private long count;
    }

    /** Dòng doanh số duyệt theo tháng. */
    @Getter
    @Builder
    public static class MonthlyApproved {
        private String month; // yyyy-MM
        private long count;
        private BigDecimal totalAmount;
    }

    /** Điểm dữ liệu tỷ giá theo ngày (vẽ line chart). */
    @Getter
    @Builder
    public static class RatePoint {
        private String date;
        private String currencyCode;
        private BigDecimal sellRate;
    }

    /** Kết quả GET /reports/dashboard. */
    @Getter
    @Builder
    public static class DashboardResponse {
        private long totalApplications;
        private long pendingCount;       // PENDING + DOCS_REQUIRED
        private BigDecimal approvedAmount;
        private List<StatusStat> byStatus;
        private List<TypeStat> byType;
        private List<MonthlyApproved> monthlyApproved;
        private List<RatePoint> exchangeRateTrend;
    }

    /** Dòng bảng trong file xuất: thông tin 1 hồ sơ. */
    public record ApplicationRow(
        String applicationCode,
        String customerName,
        String type,
        BigDecimal requestedAmount,
        String status,
        String createdAt) {}
}
