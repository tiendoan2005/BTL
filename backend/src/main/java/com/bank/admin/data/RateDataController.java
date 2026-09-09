package com.bank.admin.data;

import com.bank.admin.common.ApiResponse;
import com.bank.admin.common.PagedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.Map;

/**
 * API CRUD + import cho tỷ giá / giá vàng / lãi suất.
 * Toàn bộ yêu cầu quyền DATA_UPDATE_RATES.
 */
@Tag(name = "Dữ liệu biến động")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('DATA_UPDATE_RATES')")
public class RateDataController {

    private final RateDataService service;

    // ==================== TỶ GIÁ ====================

    @Operation(summary = "Danh sách tỷ giá (filter currency, from-to)")
    @GetMapping("/exchange-rates")
    public ApiResponse<PagedResponse<DataDtos.ExchangeRateResponse>> listExchange(
        @RequestParam(required = false) String currency,
        @RequestParam(required = false) LocalDate from,
        @RequestParam(required = false) LocalDate to,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(service.searchExchange(currency, from, to, page, size));
    }

    @Operation(summary = "Thêm tỷ giá")
    @PostMapping("/exchange-rates")
    public ResponseEntity<ApiResponse<DataDtos.ExchangeRateResponse>> createExchange(
        @Valid @RequestBody DataDtos.ExchangeRateRequest req) {
        return ResponseEntity.status(201)
            .body(ApiResponse.ok("Đã thêm tỷ giá " + req.currencyCode().toUpperCase(), service.createExchange(req)));
    }

    @Operation(summary = "Sửa tỷ giá")
    @PutMapping("/exchange-rates/{id}")
    public ApiResponse<DataDtos.ExchangeRateResponse> updateExchange(
        @PathVariable Long id, @Valid @RequestBody DataDtos.ExchangeRateRequest req) {
        return ApiResponse.ok("Đã cập nhật tỷ giá", service.updateExchange(id, req));
    }

    @Operation(summary = "Xóa tỷ giá")
    @DeleteMapping("/exchange-rates/{id}")
    public ApiResponse<Void> deleteExchange(@PathVariable Long id) {
        service.deleteExchange(id);
        return ApiResponse.message("Đã xóa tỷ giá");
    }

    @Operation(summary = "Import Excel/CSV tỷ giá (currencyCode|buy|sell|transfer|date)")
    @PostMapping(value = "/exchange-rates/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, Object>> importExchange(@RequestParam("file") MultipartFile file) {
        return ApiResponse.ok("Import tỷ giá hoàn tất", service.importExchange(file));
    }

    // ==================== GIÁ VÀNG ====================

    @Operation(summary = "Danh sách giá vàng (filter type, from-to)")
    @GetMapping("/gold-rates")
    public ApiResponse<PagedResponse<DataDtos.GoldRateResponse>> listGold(
        @RequestParam(required = false) String type,
        @RequestParam(required = false) LocalDate from,
        @RequestParam(required = false) LocalDate to,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(service.searchGold(type, from, to, page, size));
    }

    @Operation(summary = "Thêm giá vàng")
    @PostMapping("/gold-rates")
    public ResponseEntity<ApiResponse<DataDtos.GoldRateResponse>> createGold(
        @Valid @RequestBody DataDtos.GoldRateRequest req) {
        return ResponseEntity.status(201)
            .body(ApiResponse.ok("Đã thêm giá vàng " + req.goldType(), service.createGold(req)));
    }

    @Operation(summary = "Sửa giá vàng")
    @PutMapping("/gold-rates/{id}")
    public ApiResponse<DataDtos.GoldRateResponse> updateGold(
        @PathVariable Long id, @Valid @RequestBody DataDtos.GoldRateRequest req) {
        return ApiResponse.ok("Đã cập nhật giá vàng", service.updateGold(id, req));
    }

    @Operation(summary = "Xóa giá vàng")
    @DeleteMapping("/gold-rates/{id}")
    public ApiResponse<Void> deleteGold(@PathVariable Long id) {
        service.deleteGold(id);
        return ApiResponse.message("Đã xóa bản ghi giá vàng");
    }

    @Operation(summary = "Import Excel/CSV giá vàng (goldType|buy|sell|date)")
    @PostMapping(value = "/gold-rates/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, Object>> importGold(@RequestParam("file") MultipartFile file) {
        return ApiResponse.ok("Import giá vàng hoàn tất", service.importGold(file));
    }

    // ==================== LÃI SUẤT ====================

    @Operation(summary = "Danh sách lãi suất (filter product, from-to)")
    @GetMapping("/interest-rates")
    public ApiResponse<PagedResponse<DataDtos.InterestRateResponse>> listInterest(
        @RequestParam(required = false) String product,
        @RequestParam(required = false) LocalDate from,
        @RequestParam(required = false) LocalDate to,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(service.searchInterest(product, from, to, page, size));
    }

    @Operation(summary = "Thêm lãi suất")
    @PostMapping("/interest-rates")
    public ResponseEntity<ApiResponse<DataDtos.InterestRateResponse>> createInterest(
        @Valid @RequestBody DataDtos.InterestRateRequest req) {
        return ResponseEntity.status(201)
            .body(ApiResponse.ok("Đã thêm lãi suất " + req.productCode().toUpperCase(), service.createInterest(req)));
    }

    @Operation(summary = "Sửa lãi suất")
    @PutMapping("/interest-rates/{id}")
    public ApiResponse<DataDtos.InterestRateResponse> updateInterest(
        @PathVariable Long id, @Valid @RequestBody DataDtos.InterestRateRequest req) {
        return ApiResponse.ok("Đã cập nhật lãi suất", service.updateInterest(id, req));
    }

    @Operation(summary = "Xóa lãi suất")
    @DeleteMapping("/interest-rates/{id}")
    public ApiResponse<Void> deleteInterest(@PathVariable Long id) {
        service.deleteInterest(id);
        return ApiResponse.message("Đã xóa bản ghi lãi suất");
    }

    @Operation(summary = "Import Excel/CSV lãi suất (productCode|termMonths|ratePercentage|date)")
    @PostMapping(value = "/interest-rates/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, Object>> importInterest(@RequestParam("file") MultipartFile file) {
        return ApiResponse.ok("Import lãi suất hoàn tất", service.importInterest(file));
    }
}
