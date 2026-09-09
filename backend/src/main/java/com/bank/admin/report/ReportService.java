package com.bank.admin.report;

import com.bank.admin.approval.Application;
import com.bank.admin.approval.ApplicationRepository;
import com.bank.admin.common.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

/** Tổng hợp số liệu thống kê cho dashboard + file xuất. */
@Service
@RequiredArgsConstructor
public class ReportService {

    private final ApplicationRepository applicationRepo;
    private final ExchangeRateQueryRepository rateQueryRepo;

    @Transactional(readOnly = true)
    public ReportDtos.DashboardResponse dashboard(LocalDate from, LocalDate to, String type) {
        List<Application> apps = applicationRepo.findAll(); // khối lượng nhỏ, lọc in-memory
        LocalDate f = from, t = to;
        Application.Type appType = parseType(type);

        var filtered = apps.stream()
            .filter(a -> f == null || toLocalDate(a.getCreatedAt()).isAfter(f.minusDays(1)))
            .filter(a -> t == null || toLocalDate(a.getCreatedAt()).isBefore(t.plusDays(1)))
            .filter(a -> appType == null || a.getType() == appType)
            .toList();

        long total = filtered.size();
        long pending = filtered.stream()
            .filter(a -> a.getStatus() == Application.Status.PENDING
                      || a.getStatus() == Application.Status.DOCS_REQUIRED).count();
        BigDecimal approvedAmount = filtered.stream()
            .filter(a -> a.getStatus() == Application.Status.APPROVED)
            .map(Application::getRequestedAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<ReportDtos.StatusStat> byStatus = filtered.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                a -> a.getStatus().name(),
                java.util.LinkedHashMap::new,
                java.util.stream.Collectors.toList()))
            .entrySet().stream()
            .map(e -> ReportDtos.StatusStat.builder()
                .status(e.getKey())
                .count(e.getValue().size())
                .totalAmount(e.getValue().stream()
                    .map(Application::getRequestedAmount)
                    .filter(java.util.Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add))
                .build())
            .toList();

        List<ReportDtos.TypeStat> byType = filtered.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                a -> a.getType().name(),
                java.util.LinkedHashMap::new,
                java.util.stream.Collectors.counting()))
            .entrySet().stream()
            .map(e -> ReportDtos.TypeStat.builder()
                .type(e.getKey()).count(e.getValue()).build())
            .toList();

        List<ReportDtos.MonthlyApproved> monthly = filtered.stream()
            .filter(a -> a.getStatus() == Application.Status.APPROVED)
            .collect(java.util.stream.Collectors.groupingBy(
                a -> a.getUpdatedAt().atZone(ZoneId.systemDefault())
                    .toLocalDate().withDayOfMonth(1).toString(),
                java.util.TreeMap::new,
                java.util.stream.Collectors.toList()))
            .entrySet().stream()
            .map(e -> ReportDtos.MonthlyApproved.builder()
                .month(e.getKey())
                .count(e.getValue().size())
                .totalAmount(e.getValue().stream()
                    .map(Application::getRequestedAmount)
                    .filter(java.util.Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add))
                .build())
            .toList();

        List<ReportDtos.RatePoint> trend = rateQueryRepo.findRateTrend(from, to).stream()
            .map(e -> ReportDtos.RatePoint.builder()
                .date(e.getEffectiveDate().toString())
                .currencyCode(e.getCurrencyCode())
                .sellRate(e.getSellRate())
                .build())
            .toList();

        return ReportDtos.DashboardResponse.builder()
            .totalApplications(total)
            .pendingCount(pending)
            .approvedAmount(approvedAmount)
            .byStatus(byStatus)
            .byType(byType)
            .monthlyApproved(monthly)
            .exchangeRateTrend(trend)
            .build();
    }

    /** Dòng dữ liệu hồ sơ cho file xuất (áp dụng cùng bộ lọc). */
    @Transactional(readOnly = true)
    public List<ReportDtos.ApplicationRow> applicationRows(LocalDate from, LocalDate to, String type) {
        Application.Type appType = parseType(type);
        return applicationRepo.findAll().stream()
            .filter(a -> from == null || toLocalDate(a.getCreatedAt()).isAfter(from.minusDays(1)))
            .filter(a -> to == null || toLocalDate(a.getCreatedAt()).isBefore(to.plusDays(1)))
            .filter(a -> appType == null || a.getType() == appType)
            .map(a -> new ReportDtos.ApplicationRow(
                a.getApplicationCode(),
                a.getCustomer().getFullName(),
                a.getType().name(),
                a.getRequestedAmount(),
                a.getStatus().name(),
                toLocalDate(a.getCreatedAt()).toString()))
            .toList();
    }

    private Application.Type parseType(String type) {
        if (type == null || type.isBlank()) return null;
        try {
            return Application.Type.valueOf(type);
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Loại hồ sơ không hợp lệ: " + type);
        }
    }

    private LocalDate toLocalDate(java.time.Instant instant) {
        return instant.atZone(ZoneId.systemDefault()).toLocalDate();
    }
}
