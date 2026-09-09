package com.bank.admin.portal;

import com.bank.admin.approval.Application;
import com.bank.admin.approval.ApplicationRepository;
import com.bank.admin.approval.Customer;
import com.bank.admin.approval.CustomerRepository;
import com.bank.admin.cms.Post;
import com.bank.admin.cms.PostRepository;
import com.bank.admin.common.ApiResponse;
import com.bank.admin.data.ExchangeRateRepository;
import com.bank.admin.data.GoldRateRepository;
import com.bank.admin.data.InterestRateRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

/**
 * Public API phục vụ Cổng thông tin khách hàng (Public Portal - Vietcombank Style).
 * Không yêu cầu đăng nhập cán bộ.
 */
@Slf4j
@Tag(name = "Public Portal (Vietcombank)")
@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class PublicPortalController {

    private final ExchangeRateRepository exchangeRateRepo;
    private final GoldRateRepository goldRateRepo;
    private final InterestRateRepository interestRateRepo;
    private final PostRepository postRepo;
    private final ApplicationRepository applicationRepo;
    private final CustomerRepository customerRepo;

    // ================= DTOs =================
    public record PublicApplyRequest(
        @NotBlank(message = "Họ tên không được để trống") String fullName,
        @NotBlank(message = "Số CCCD/CMND không được để trống") String idCardNumber,
        @NotBlank(message = "Số điện thoại không được để trống") String phoneNumber,
        String email,
        @NotBlank(message = "Loại hồ sơ không được để trống (LOAN, CARD_ISSUANCE, LIMIT_APPROVAL)") String applicationType,
        @NotNull(message = "Số tiền đề xuất không được để trống")
        @DecimalMin(value = "1000000", message = "Số tiền tối thiểu là 1,000,000 VND") BigDecimal requestedAmount,
        String note
    ) {}

    @Builder
    public record PublicApplyResponse(
        String applicationCode,
        String customerName,
        String applicationType,
        BigDecimal requestedAmount,
        String status,
        String message
    ) {}

    @Operation(summary = "Lấy tỷ giá ngoại tệ mới nhất cho bảng tra cứu trang chủ")
    @GetMapping("/rates/exchange")
    public ApiResponse<List<Map<String, Object>>> getLatestExchangeRates() {
        var page = exchangeRateRepo.search(null, null, null, PageRequest.of(0, 30));
        var list = page.getContent().stream().map(e -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("currencyCode", e.getCurrencyCode());
            m.put("buyRate", e.getBuyRate());
            m.put("transferRate", e.getTransferRate());
            m.put("sellRate", e.getSellRate());
            m.put("effectiveDate", e.getEffectiveDate());
            return m;
        }).toList();
        return ApiResponse.ok(list);
    }

    @Operation(summary = "Lấy bảng giá vàng mới nhất")
    @GetMapping("/rates/gold")
    public ApiResponse<List<Map<String, Object>>> getLatestGoldRates() {
        var page = goldRateRepo.search(null, null, null, PageRequest.of(0, 20));
        var list = page.getContent().stream().map(g -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("goldType", g.getGoldType());
            m.put("buyPrice", g.getBuyPrice());
            m.put("sellPrice", g.getSellPrice());
            m.put("effectiveDate", g.getEffectiveDate());
            return m;
        }).toList();
        return ApiResponse.ok(list);
    }

    @Operation(summary = "Lấy bảng lãi suất tiết kiệm theo kỳ hạn")
    @GetMapping("/rates/interest")
    public ApiResponse<List<Map<String, Object>>> getLatestInterestRates() {
        var page = interestRateRepo.search(null, null, null, PageRequest.of(0, 30));
        var list = page.getContent().stream().map(i -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("productCode", i.getProductCode());
            m.put("termMonths", i.getTermMonths());
            m.put("ratePercentage", i.getRatePercentage());
            m.put("effectiveDate", i.getEffectiveDate());
            return m;
        }).toList();
        return ApiResponse.ok(list);
    }

    @Operation(summary = "Lấy danh sách tin tức / ưu đãi Vietcombank nổi bật")
    @GetMapping("/posts")
    public ApiResponse<List<Map<String, Object>>> getPublicPosts() {
        var page = postRepo.search(null, Post.Status.PUBLISHED, null, PageRequest.of(0, 6));
        var list = page.getContent().stream().map(p -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", p.getId());
            m.put("title", p.getTitle());
            m.put("slug", p.getSlug());
            m.put("summary", p.getSummary());
            m.put("thumbnailUrl", p.getThumbnailUrl());
            m.put("categoryName", p.getCategory() != null ? p.getCategory().getName() : "Tin tức");
            m.put("createdAt", p.getCreatedAt());
            return m;
        }).toList();
        return ApiResponse.ok(list);
    }

    @Operation(summary = "Khách hàng gửi yêu cầu Vay vốn / Mở thẻ trực tuyến")
    @PostMapping("/apply")
    @Transactional
    public ResponseEntity<ApiResponse<PublicApplyResponse>> submitApplication(@Valid @RequestBody PublicApplyRequest req) {
        Customer customer = customerRepo.findByIdCardNumber(req.idCardNumber())
            .orElseGet(() -> {
                Customer newCust = Customer.builder()
                    .fullName(req.fullName().trim())
                    .idCardNumber(req.idCardNumber().trim())
                    .phoneNumber(req.phoneNumber().trim())
                    .email(req.email() != null ? req.email().trim() : null)
                    .build();
                return customerRepo.save(newCust);
            });

        // Tạo mã hồ sơ ngẫu nhiên chuẩn ngân hàng (vd: VCB-2026-XXXX)
        String appCode = "VCB-" + LocalDate.now().getYear() + "-" + String.format("%05d", (int)(Math.random() * 90000) + 10000);
        while (applicationRepo.existsByApplicationCode(appCode)) {
            appCode = "VCB-" + LocalDate.now().getYear() + "-" + String.format("%05d", (int)(Math.random() * 90000) + 10000);
        }

        Application.Type appType;
        try {
            appType = Application.Type.valueOf(req.applicationType().toUpperCase());
        } catch (Exception e) {
            appType = Application.Type.LOAN;
        }

        Application application = Application.builder()
            .applicationCode(appCode)
            .customer(customer)
            .type(appType)
            .requestedAmount(req.requestedAmount())
            .status(Application.Status.PENDING)
            .build();

        applicationRepo.save(application);
        log.info("Khách hàng {} ({}) đã gửi hồ sơ trực tuyến {}", customer.getFullName(), customer.getPhoneNumber(), appCode);

        PublicApplyResponse res = PublicApplyResponse.builder()
            .applicationCode(appCode)
            .customerName(customer.getFullName())
            .applicationType(appType.name())
            .requestedAmount(req.requestedAmount())
            .status("PENDING")
            .message("Hồ sơ đã được gửi thành công. Cán bộ Vietcombank sẽ liên hệ trong vòng 24h làm việc.")
            .build();

        return ResponseEntity.status(201).body(ApiResponse.ok("Nộp hồ sơ thành công", res));
    }
}
