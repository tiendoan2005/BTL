package com.bank.admin.data;

import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

/** DTO gom chung của module Dữ liệu biến động. */
public final class DataDtos {

    private DataDtos() {}

    // ---------- Tỷ giá ----------

    public record ExchangeRateRequest(
        @NotBlank(message = "Mã ngoại tệ không được để trống") @Size(max = 10) String currencyCode,
        @NotNull @DecimalMin(value = "0", message = "Tỷ giá mua phải > 0") BigDecimal buyRate,
        @NotNull @DecimalMin(value = "0", message = "Tỷ giá bán phải > 0") BigDecimal sellRate,
        @NotNull @DecimalMin(value = "0", message = "Tỷ giá chuyển khoản phải > 0") BigDecimal transferRate,
        @NotNull(message = "Ngày hiệu lực không được để trống") LocalDate effectiveDate) {}

    @Getter
    @Builder
    public static class ExchangeRateResponse {
        private Long id;
        private String currencyCode;
        private BigDecimal buyRate;
        private BigDecimal sellRate;
        private BigDecimal transferRate;
        private LocalDate effectiveDate;
        private Long createdBy;
        private String createdByName;
    }

    // ---------- Giá vàng ----------

    public record GoldRateRequest(
        @NotBlank(message = "Loại vàng không được để trống") @Size(max = 50) String goldType,
        @NotNull @DecimalMin(value = "0", message = "Giá mua phải > 0") BigDecimal buyPrice,
        @NotNull @DecimalMin(value = "0", message = "Giá bán phải > 0") BigDecimal sellPrice,
        @NotNull(message = "Ngày hiệu lực không được để trống") LocalDate effectiveDate) {}

    @Getter
    @Builder
    public static class GoldRateResponse {
        private Long id;
        private String goldType;
        private BigDecimal buyPrice;
        private BigDecimal sellPrice;
        private LocalDate effectiveDate;
        private Long createdBy;
        private String createdByName;
    }

    // ---------- Lãi suất ----------

    public record InterestRateRequest(
        @NotBlank(message = "Mã sản phẩm không được để trống") @Size(max = 50) String productCode,
        @NotNull @Min(value = 1, message = "Kỳ hạn tối thiểu 1 tháng") @Max(value = 360, message = "Kỳ hạn tối đa 360 tháng") Integer termMonths,
        @NotNull @DecimalMin(value = "0") @DecimalMax(value = "100", message = "Lãi suất tối đa 100%") BigDecimal ratePercentage,
        @NotNull(message = "Ngày hiệu lực không được để trống") LocalDate effectiveDate) {}

    @Getter
    @Builder
    public static class InterestRateResponse {
        private Long id;
        private String productCode;
        private Integer termMonths;
        private BigDecimal ratePercentage;
        private LocalDate effectiveDate;
        private Long createdBy;
        private String createdByName;
    }

    // ---------- Biểu phí / biểu mẫu ----------

    public record FeeTemplateUpdateRequest(
        @NotBlank(message = "Tiêu đề không được để trống") @Size(max = 255) String title,
        Boolean isActive) {}
}
