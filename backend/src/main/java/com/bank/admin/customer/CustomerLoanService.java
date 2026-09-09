package com.bank.admin.customer;

import com.bank.admin.approval.*;
import com.bank.admin.common.ApiException;
import com.bank.admin.customer.dto.CustomerDtos.*;
import com.bank.admin.data.InterestRate;
import com.bank.admin.data.InterestRateRepository;
import com.bank.admin.security.SecurityContextUtils;
import com.bank.admin.staff.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerLoanService {

    private final CustomerRepository customerRepo;
    private final ApplicationRepository applicationRepo;
    private final LoanApplicationDetailRepository loanDetailRepo;
    private final CarLoanDetailRepository carDetailRepo;
    private final LoanCollateralRepository collateralRepo;
    private final ApplicationDocumentRepository documentRepo;
    private final CustomerSavingRepository savingRepo;
    private final TradeFinanceRequestRepository tradeFinanceRepo;
    private final InterestRateRepository interestRateRepo;

    // =========================================================================
    // 1. VAY TIÊU DÙNG CÁ NHÂN (CONSUMER LOAN)
    // =========================================================================
    @Transactional
    public ApplicationSummaryResponse applyConsumerLoan(ConsumerLoanRequest req) {
        Customer customer = getLoggedInCustomer();
        if (customer.getCustomerType() != Customer.CustomerType.INDIVIDUAL) {
            throw ApiException.badRequest("Chức năng chỉ dành cho Khách hàng cá nhân");
        }

        String appCode = generateApplicationCode("APP-CONSUMER");
        Application app = Application.builder()
            .applicationCode(appCode)
            .customer(customer)
            .type(Application.Type.LOAN)
            .requestedAmount(req.requestedAmount())
            .status(Application.Status.PENDING)
            .build();
        app = applicationRepo.save(app);

        // Chi tiết khoản vay
        LoanApplicationDetail detail = LoanApplicationDetail.builder()
            .application(app)
            .loanPurpose(LoanApplicationDetail.Purpose.CONSUMER)
            .loanAmount(req.requestedAmount())
            .loanTermMonths(req.termMonths())
            .interestRatePercentage(BigDecimal.valueOf(9.50))
            .build();
        loanDetailRepo.save(detail);

        // Upload chứng từ nếu có
        List<String> docUrls = new ArrayList<>();
        if (req.incomeProofDocUrl() != null && !req.incomeProofDocUrl().isBlank()) {
            ApplicationDocument doc = ApplicationDocument.builder()
                .application(app)
                .documentName("Sao kê lương & Giấy tờ thu nhập")
                .fileUrl(req.incomeProofDocUrl().trim())
                .build();
            documentRepo.save(doc);
            docUrls.add(doc.getFileUrl());
        }

        return toAppSummary(app, "Vay tiêu dùng cá nhân (" + req.termMonths() + " tháng)", docUrls);
    }

    // =========================================================================
    // 2. VAY MUA Ô TÔ (AUTO LOAN)
    // =========================================================================
    @Transactional
    public ApplicationSummaryResponse applyAutoLoan(AutoLoanRequest req) {
        Customer customer = getLoggedInCustomer();
        if (customer.getCustomerType() != Customer.CustomerType.INDIVIDUAL) {
            throw ApiException.badRequest("Chức năng chỉ dành cho Khách hàng cá nhân");
        }

        String appCode = generateApplicationCode("APP-AUTO");
        Application app = Application.builder()
            .applicationCode(appCode)
            .customer(customer)
            .type(Application.Type.LOAN)
            .requestedAmount(req.requestedAmount())
            .status(Application.Status.PENDING)
            .build();
        app = applicationRepo.save(app);

        LoanApplicationDetail detail = LoanApplicationDetail.builder()
            .application(app)
            .loanPurpose(LoanApplicationDetail.Purpose.AUTO)
            .loanAmount(req.requestedAmount())
            .loanTermMonths(req.termMonths())
            .interestRatePercentage(BigDecimal.valueOf(8.50))
            .build();
        detail = loanDetailRepo.save(detail);

        // Chi tiết xe
        CarLoanDetail carDetail = CarLoanDetail.builder()
            .loanApplication(detail)
            .carBrand(req.carBrand().trim())
            .carModel(req.carModel().trim())
            .manufactureYear(req.manufactureYear())
            .carPrice(req.carPrice())
            .isNewCar(req.isNewCar() != null ? req.isNewCar() : true)
            .build();
        carDetailRepo.save(carDetail);

        // Tài sản bảo đảm mặc định là chính xe mua
        LoanCollateral collateral = LoanCollateral.builder()
            .loanApplication(detail)
            .collateralType(LoanCollateral.CollateralType.CAR)
            .collateralName("Xe ô tô " + req.carBrand() + " " + req.carModel() + " " + req.manufactureYear())
            .estimatedValue(req.carPrice())
            .documentProofUrl(req.carQuoteDocUrl())
            .build();
        collateralRepo.save(collateral);

        List<String> docUrls = new ArrayList<>();
        if (req.carQuoteDocUrl() != null && !req.carQuoteDocUrl().isBlank()) {
            ApplicationDocument doc = ApplicationDocument.builder()
                .application(app)
                .documentName("Hợp đồng mua bán xe & Báo giá đại lý")
                .fileUrl(req.carQuoteDocUrl().trim())
                .build();
            documentRepo.save(doc);
            docUrls.add(doc.getFileUrl());
        }

        return toAppSummary(app, "Vay mua ô tô: " + req.carBrand() + " " + req.carModel(), docUrls);
    }

    // =========================================================================
    // 3. MỞ THẺ TÍN DỤNG (CREDIT CARD)
    // =========================================================================
    @Transactional
    public ApplicationSummaryResponse applyCreditCard(CreditCardApplyRequest req) {
        Customer customer = getLoggedInCustomer();
        if (customer.getCustomerType() != Customer.CustomerType.INDIVIDUAL) {
            throw ApiException.badRequest("Chức năng chỉ dành cho Khách hàng cá nhân");
        }

        String appCode = generateApplicationCode("APP-CARD");
        Application app = Application.builder()
            .applicationCode(appCode)
            .customer(customer)
            .type(Application.Type.CARD_ISSUANCE)
            .requestedAmount(req.requestedLimit())
            .status(Application.Status.PENDING)
            .build();
        app = applicationRepo.save(app);

        List<String> docUrls = new ArrayList<>();
        if (req.proofDocUrl() != null && !req.proofDocUrl().isBlank()) {
            ApplicationDocument doc = ApplicationDocument.builder()
                .application(app)
                .documentName("Hồ sơ chứng minh tài chính mở thẻ tín dụng")
                .fileUrl(req.proofDocUrl().trim())
                .build();
            documentRepo.save(doc);
            docUrls.add(doc.getFileUrl());
        }

        String category = req.cardCategory() != null ? req.cardCategory() : "VIETCOMBANK VISA PLATINUM";
        return toAppSummary(app, "Mở thẻ tín dụng quốc tế: " + category, docUrls);
    }

    // =========================================================================
    // 4. GỬI TIẾT KIỆM ONLINE (SAVINGS)
    // =========================================================================
    @Transactional
    public SavingsResponse applySavings(SavingsApplyRequest req) {
        Customer customer = getLoggedInCustomer();

        // Lấy lãi suất theo kỳ hạn từ database hoặc mặc định
        BigDecimal rate = BigDecimal.valueOf(5.20);
        if (req.termMonths() >= 12) rate = BigDecimal.valueOf(6.80);
        else if (req.termMonths() >= 6) rate = BigDecimal.valueOf(5.50);
        else if (req.termMonths() >= 3) rate = BigDecimal.valueOf(4.50);

        // Tiền lãi = Tiền gửi * (% lãi / 100) * (Số tháng / 12)
        BigDecimal expectedInterest = req.depositAmount()
            .multiply(rate)
            .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(req.termMonths()))
            .divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);

        String code = "STK-" + LocalDate.now().getYear() + "-" + String.format("%06d", (int)(Math.random() * 900000) + 100000);
        LocalDate maturityDate = LocalDate.now().plusMonths(req.termMonths());

        CustomerSaving saving = CustomerSaving.builder()
            .savingCode(code)
            .customer(customer)
            .productCode(req.productCode().trim())
            .depositAmount(req.depositAmount())
            .termMonths(req.termMonths())
            .interestRate(rate)
            .expectedInterest(expectedInterest)
            .maturityDate(maturityDate)
            .status(CustomerSaving.Status.ACTIVE)
            .build();

        saving = savingRepo.save(saving);

        return SavingsResponse.builder()
            .id(saving.getId())
            .savingCode(saving.getSavingCode())
            .productCode(saving.getProductCode())
            .depositAmount(saving.getDepositAmount())
            .termMonths(saving.getTermMonths())
            .interestRate(saving.getInterestRate())
            .expectedInterest(saving.getExpectedInterest())
            .maturityDate(saving.getMaturityDate())
            .status(saving.getStatus().name())
            .createdAt(saving.getCreatedAt())
            .build();
    }

    @Transactional(readOnly = true)
    public List<SavingsResponse> getMySavings() {
        Long customerId = SecurityContextUtils.currentCustomerId();
        return savingRepo.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
            .map(s -> SavingsResponse.builder()
                .id(s.getId())
                .savingCode(s.getSavingCode())
                .productCode(s.getProductCode())
                .depositAmount(s.getDepositAmount())
                .termMonths(s.getTermMonths())
                .interestRate(s.getInterestRate())
                .expectedInterest(s.getExpectedInterest())
                .maturityDate(s.getMaturityDate())
                .status(s.getStatus().name())
                .createdAt(s.getCreatedAt())
                .build())
            .toList();
    }

    // =========================================================================
    // 5. VAY SẢN XUẤT KINH DOANH DOANH NGHIỆP (BUSINESS LOAN)
    // =========================================================================
    @Transactional
    public ApplicationSummaryResponse applyBusinessLoan(BusinessLoanRequest req) {
        Customer customer = getLoggedInCustomer();
        if (customer.getCustomerType() != Customer.CustomerType.ENTERPRISE) {
            throw ApiException.badRequest("Chức năng chỉ dành cho Khách hàng doanh nghiệp");
        }

        String appCode = generateApplicationCode("APP-BUSINESS");
        Application app = Application.builder()
            .applicationCode(appCode)
            .customer(customer)
            .type(Application.Type.LOAN)
            .requestedAmount(req.requestedAmount())
            .status(Application.Status.PENDING)
            .build();
        app = applicationRepo.save(app);

        LoanApplicationDetail detail = LoanApplicationDetail.builder()
            .application(app)
            .loanPurpose(LoanApplicationDetail.Purpose.BUSINESS)
            .loanAmount(req.requestedAmount())
            .loanTermMonths(req.termMonths())
            .interestRatePercentage(BigDecimal.valueOf(7.80))
            .build();
        loanDetailRepo.save(detail);

        List<String> docUrls = new ArrayList<>();
        if (req.financialReportDocUrl() != null && !req.financialReportDocUrl().isBlank()) {
            ApplicationDocument doc = ApplicationDocument.builder()
                .application(app)
                .documentName("Báo cáo tài chính & Phương án kinh doanh")
                .fileUrl(req.financialReportDocUrl().trim())
                .build();
            documentRepo.save(doc);
            docUrls.add(doc.getFileUrl());
        }

        return toAppSummary(app, "Vay SXKD: " + req.businessPlanSummary(), docUrls);
    }

    // =========================================================================
    // 6. TÀI TRỢ THƯƠNG MẠI (TRADE FINANCE: L/C & BẢO LÃNH)
    // =========================================================================
    @Transactional
    public TradeFinanceResponse applyTradeFinance(TradeFinanceApplyRequest req) {
        Customer customer = getLoggedInCustomer();
        if (customer.getCustomerType() != Customer.CustomerType.ENTERPRISE) {
            throw ApiException.badRequest("Chức năng chỉ dành cho Khách hàng doanh nghiệp");
        }

        TradeFinanceRequest.ServiceType type;
        try {
            type = TradeFinanceRequest.ServiceType.valueOf(req.serviceType().toUpperCase());
        } catch (Exception e) {
            throw ApiException.badRequest("Loại dịch vụ tài trợ thương mại không hợp lệ");
        }

        String code = "TF-" + LocalDate.now().getYear() + "-" + String.format("%05d", (int)(Math.random() * 90000) + 10000);
        TradeFinanceRequest tf = TradeFinanceRequest.builder()
            .requestCode(code)
            .customer(customer)
            .serviceType(type)
            .amount(req.amount())
            .currency(req.currency() != null && !req.currency().isBlank() ? req.currency().trim() : "VND")
            .beneficiaryName(req.beneficiaryName().trim())
            .purpose(req.purpose().trim())
            .documentUrl(req.documentUrl())
            .status(TradeFinanceRequest.Status.PENDING)
            .build();

        tf = tradeFinanceRepo.save(tf);

        return TradeFinanceResponse.builder()
            .id(tf.getId())
            .requestCode(tf.getRequestCode())
            .serviceType(tf.getServiceType().name())
            .amount(tf.getAmount())
            .currency(tf.getCurrency())
            .beneficiaryName(tf.getBeneficiaryName())
            .purpose(tf.getPurpose())
            .documentUrl(tf.getDocumentUrl())
            .status(tf.getStatus().name())
            .createdAt(tf.getCreatedAt())
            .build();
    }

    @Transactional(readOnly = true)
    public List<TradeFinanceResponse> getMyTradeFinance() {
        Long customerId = SecurityContextUtils.currentCustomerId();
        return tradeFinanceRepo.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
            .map(tf -> TradeFinanceResponse.builder()
                .id(tf.getId())
                .requestCode(tf.getRequestCode())
                .serviceType(tf.getServiceType().name())
                .amount(tf.getAmount())
                .currency(tf.getCurrency())
                .beneficiaryName(tf.getBeneficiaryName())
                .purpose(tf.getPurpose())
                .documentUrl(tf.getDocumentUrl())
                .status(tf.getStatus().name())
                .createdAt(tf.getCreatedAt())
                .build())
            .toList();
    }

    // =========================================================================
    // 7. TRA CỨU HỒ SƠ CỦA TÔI (MY APPLICATIONS)
    // =========================================================================
    @Transactional(readOnly = true)
    public List<ApplicationSummaryResponse> getMyApplications() {
        Long customerId = SecurityContextUtils.currentCustomerId();
        List<Application> apps = applicationRepo.findByCustomerIdOrderByCreatedAtDesc(customerId);

        return apps.stream().map(a -> {
            List<String> docs = documentRepo.findByApplicationIdOrderByUploadedAtAsc(a.getId())
                .stream().map(ApplicationDocument::getFileUrl).toList();
            return toAppSummary(a, a.getType().name(), docs);
        }).toList();
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================
    private Customer getLoggedInCustomer() {
        Long id = SecurityContextUtils.currentCustomerId();
        return customerRepo.findById(id)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy thông tin khách hàng"));
    }

    private String generateApplicationCode(String prefix) {
        return prefix + "-" + LocalDate.now().getYear() + "-" + String.format("%04d", (int)(Math.random() * 9000) + 1000);
    }

    private ApplicationSummaryResponse toAppSummary(Application a, String purpose, List<String> docs) {
        return ApplicationSummaryResponse.builder()
            .id(a.getId())
            .applicationCode(a.getApplicationCode())
            .applicationType(a.getType().name())
            .requestedAmount(a.getRequestedAmount())
            .status(a.getStatus().name())
            .createdAt(a.getCreatedAt())
            .updatedAt(a.getUpdatedAt())
            .purposeOrDetail(purpose)
            .documentUrls(docs)
            .build();
    }
}
