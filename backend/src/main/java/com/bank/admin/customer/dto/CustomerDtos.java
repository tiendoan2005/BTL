package com.bank.admin.customer.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class CustomerDtos {

    private CustomerDtos() {}

    // ==========================================
    // 1. AUTH & PROFILE & REGISTER DTOS
    // ==========================================
    public record CustomerLoginRequest(
        @NotBlank(message = "Tên đăng nhập không được để trống") String username,
        @NotBlank(message = "Mật khẩu không được để trống") String password
    ) {}

    public record CustomerRegisterRequest(
        @NotBlank(message = "Tên đăng nhập không được để trống") String username,
        @NotBlank(message = "Mật khẩu không được để trống") String password,
        @NotBlank(message = "Họ và tên / Tên tổ chức không được để trống") String fullName,
        @NotNull(message = "Loại khách hàng không được để trống") String customerType, // INDIVIDUAL, ENTERPRISE
        @NotBlank(message = "Số CMND/CCCD hoặc Giấy ĐKKD không được để trống") String idCardNumber,
        @NotBlank(message = "Số điện thoại không được để trống") String phoneNumber,
        String email,

        // Chi tiết Cá nhân (khi customerType = INDIVIDUAL)
        LocalDate dateOfBirth,
        String gender,
        BigDecimal monthlyIncome,
        String companyName,
        String position,

        // Chi tiết Doanh nghiệp (khi customerType = ENTERPRISE)
        String taxCode,
        String enterpriseCompanyName,
        String representativeName,
        String businessLicenseNumber,
        BigDecimal charterCapital
    ) {}

    @Builder
    public record CustomerLoginResponse(
        String accessToken,
        String tokenType,
        Long customerId,
        String username,
        String fullName,
        String customerType, // INDIVIDUAL, ENTERPRISE
        String email,
        String phoneNumber
    ) {}

    @Builder
    public record CustomerProfileResponse(
        Long customerId,
        String username,
        String fullName,
        String customerType,
        String idCardNumber,
        String phoneNumber,
        String email,
        String status,
        Instant createdAt,
        // Dành cho khách hàng cá nhân
        IndividualDetailDto individual,
        // Dành cho khách hàng doanh nghiệp
        EnterpriseDetailDto enterprise
    ) {}

    @Builder
    public record IndividualDetailDto(
        LocalDate dateOfBirth,
        String gender,
        BigDecimal monthlyIncome,
        String companyName,
        String position
    ) {}

    @Builder
    public record EnterpriseDetailDto(
        String taxCode,
        String companyName,
        String representativeName,
        String businessLicenseNumber,
        BigDecimal charterCapital
    ) {}

    // ==========================================
    // 2. KHÁCH HÀNG CÁ NHÂN: LOANS & CAR & CARDS & SAVINGS
    // ==========================================
    public record ConsumerLoanRequest(
        @NotNull(message = "Số tiền vay không được để trống")
        @DecimalMin(value = "5000000", message = "Số tiền vay tối thiểu 5,000,000 VND")
        BigDecimal requestedAmount,

        @NotNull(message = "Kỳ hạn vay không được để trống")
        @Min(value = 6, message = "Kỳ hạn tối thiểu 6 tháng")
        Integer termMonths,

        String incomeProofDocUrl // Đính kèm sao kê lương / HĐLĐ
    ) {}

    public record AutoLoanRequest(
        @NotNull(message = "Số tiền vay không được để trống")
        @DecimalMin(value = "50000000", message = "Số tiền vay mua xe tối thiểu 50,000,000 VND")
        BigDecimal requestedAmount,

        @NotNull(message = "Kỳ hạn vay không được để trống")
        @Min(value = 12, message = "Kỳ hạn tối thiểu 12 tháng")
        Integer termMonths,

        @NotBlank(message = "Hãng xe không được để trống") String carBrand,
        @NotBlank(message = "Dòng xe không được để trống") String carModel,
        @NotNull(message = "Năm sản xuất không được để trống") Integer manufactureYear,
        @NotNull(message = "Giá xe không được để trống") BigDecimal carPrice,
        Boolean isNewCar,
        String carQuoteDocUrl // Báo giá đại lý / HĐ mua bán
    ) {}

    public record CreditCardApplyRequest(
        @NotNull(message = "Hạn mức thẻ đề xuất không được để trống")
        @DecimalMin(value = "10000000", message = "Hạn mức tối thiểu 10,000,000 VND")
        BigDecimal requestedLimit,

        String cardCategory, // VISA_PLATINUM, JCB_GOLD, MASTER_CLASSIC...
        String proofDocUrl
    ) {}

    public record SavingsApplyRequest(
        @NotBlank(message = "Gói tiết kiệm không được để trống") String productCode,
        @NotNull(message = "Số tiền gửi tiết kiệm không được để trống")
        @DecimalMin(value = "1000000", message = "Số tiền gửi tối thiểu 1,000,000 VND")
        BigDecimal depositAmount,
        @NotNull(message = "Kỳ hạn gửi không được để trống") Integer termMonths
    ) {}

    @Builder
    public record SavingsResponse(
        Long id,
        String savingCode,
        String productCode,
        BigDecimal depositAmount,
        Integer termMonths,
        BigDecimal interestRate,
        BigDecimal expectedInterest,
        LocalDate maturityDate,
        String status,
        Instant createdAt
    ) {}

    // ==========================================
    // 3. KHÁCH HÀNG DOANH NGHIỆP: BUSINESS LOAN & CASH FLOW & TRADE FINANCE
    // ==========================================
    public record BusinessLoanRequest(
        @NotNull(message = "Hạn mức vay kinh doanh không được để trống")
        @DecimalMin(value = "100000000", message = "Hạn mức tối thiểu 100,000,000 VND")
        BigDecimal requestedAmount,

        @NotNull(message = "Kỳ hạn vay không được để trống")
        Integer termMonths,

        @NotBlank(message = "Phương án kinh doanh không được để trống")
        String businessPlanSummary,

        String financialReportDocUrl // Báo cáo tài chính / Giấy phép KD
    ) {}

    public record TradeFinanceApplyRequest(
        @NotBlank(message = "Loại dịch vụ không được để trống") String serviceType, // LETTER_OF_CREDIT, BANK_GUARANTEE, IMPORT_EXPORT_FINANCE
        @NotNull(message = "Số tiền bảo lãnh/LC không được để trống")
        @DecimalMin(value = "10000000", message = "Số tiền tối thiểu 10,000,000 VND")
        BigDecimal amount,
        String currency,
        @NotBlank(message = "Tên bên thụ hưởng không được để trống") String beneficiaryName,
        @NotBlank(message = "Mục đích không được để trống") String purpose,
        String documentUrl
    ) {}

    @Builder
    public record TradeFinanceResponse(
        Long id,
        String requestCode,
        String serviceType,
        BigDecimal amount,
        String currency,
        String beneficiaryName,
        String purpose,
        String documentUrl,
        String status,
        Instant createdAt
    ) {}

    @Builder
    public record CashFlowStatisticResponse(
        BigDecimal totalInflow,   // Tổng tiền vào
        BigDecimal totalOutflow,  // Tổng tiền ra
        BigDecimal netCashFlow,   // Dòng tiền thuần (Inflow - Outflow)
        Long totalTransactions,
        List<CashFlowItemDto> recentTransactions
    ) {}

    @Builder
    public record CashFlowItemDto(
        Long id,
        String transactionCode,
        String type, // INFLOW, OUTFLOW
        BigDecimal amount,
        String counterpartyName,
        String bankName,
        String description,
        Instant createdAt
    ) {}

    // ==========================================
    // 4. COMMON APPLICATION & TRANSACTION DTOS
    // ==========================================
    @Builder
    public record ApplicationSummaryResponse(
        Long id,
        String applicationCode,
        String applicationType,
        BigDecimal requestedAmount,
        String status,
        Instant createdAt,
        Instant updatedAt,
        String purposeOrDetail,
        List<String> documentUrls
    ) {}
}
