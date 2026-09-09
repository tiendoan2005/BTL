package com.bank.admin.customer;

import com.bank.admin.common.ApiResponse;
import com.bank.admin.customer.dto.CustomerDtos.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/customer", "/api/customer"})
@RequiredArgsConstructor
public class CustomerLoanController {

    private final CustomerLoanService loanService;

    // ================= 1. KHÁCH HÀNG CÁ NHÂN =================
    @PostMapping("/loans/consumer")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('INDIVIDUAL')")
    public ApiResponse<ApplicationSummaryResponse> applyConsumerLoan(@Valid @RequestBody ConsumerLoanRequest req) {
        return ApiResponse.ok("Nộp hồ sơ vay tiêu dùng thành công", loanService.applyConsumerLoan(req));
    }

    @PostMapping("/loans/auto")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('INDIVIDUAL')")
    public ApiResponse<ApplicationSummaryResponse> applyAutoLoan(@Valid @RequestBody AutoLoanRequest req) {
        return ApiResponse.ok("Nộp hồ sơ vay mua ô tô thành công", loanService.applyAutoLoan(req));
    }

    @PostMapping("/cards")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('INDIVIDUAL')")
    public ApiResponse<ApplicationSummaryResponse> applyCreditCard(@Valid @RequestBody CreditCardApplyRequest req) {
        return ApiResponse.ok("Nộp hồ sơ phát hành thẻ tín dụng thành công", loanService.applyCreditCard(req));
    }

    @PostMapping("/savings")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('INDIVIDUAL') or hasRole('ENTERPRISE')")
    public ApiResponse<SavingsResponse> applySavings(@Valid @RequestBody SavingsApplyRequest req) {
        return ApiResponse.ok("Mở sổ tiết kiệm Online thành công", loanService.applySavings(req));
    }

    @GetMapping("/savings")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('INDIVIDUAL') or hasRole('ENTERPRISE')")
    public ApiResponse<List<SavingsResponse>> getMySavings() {
        return ApiResponse.ok(loanService.getMySavings());
    }

    // ================= 2. KHÁCH HÀNG DOANH NGHIỆP =================
    @PostMapping("/loans/business")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ENTERPRISE')")
    public ApiResponse<ApplicationSummaryResponse> applyBusinessLoan(@Valid @RequestBody BusinessLoanRequest req) {
        return ApiResponse.ok("Nộp hồ sơ vay sản xuất kinh doanh thành công", loanService.applyBusinessLoan(req));
    }

    @PostMapping("/trade-finance")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ENTERPRISE')")
    public ApiResponse<TradeFinanceResponse> applyTradeFinance(@Valid @RequestBody TradeFinanceApplyRequest req) {
        return ApiResponse.ok("Gửi yêu cầu tài trợ thương mại thành công", loanService.applyTradeFinance(req));
    }

    @GetMapping("/trade-finance")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ENTERPRISE')")
    public ApiResponse<List<TradeFinanceResponse>> getMyTradeFinance() {
        return ApiResponse.ok(loanService.getMyTradeFinance());
    }

    // ================= 3. TIỆN ÍCH CHUNG =================
    @GetMapping("/my-applications")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('INDIVIDUAL') or hasRole('ENTERPRISE')")
    public ApiResponse<List<ApplicationSummaryResponse>> getMyApplications() {
        return ApiResponse.ok(loanService.getMyApplications());
    }
}
