package com.bank.admin.data;

import com.bank.admin.audit.Audited;
import com.bank.admin.common.ApiException;
import com.bank.admin.common.PagedResponse;
import com.bank.admin.security.SecurityContextUtils;
import com.bank.admin.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

/**
 * CRUD + import hàng loạt cho tỷ giá / giá vàng / lãi suất.
 * Mọi thao tác ghi đều gắn @Audited để ghi audit_logs.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RateDataService {

    private final ExchangeRateRepository exchangeRepo;
    private final GoldRateRepository goldRepo;
    private final InterestRateRepository interestRepo;
    private final UserRepository userRepository;
    private final RateDataImportParser parser;

    private static final String MODULE = "DATA";

    // ==================== TỶ GIÁ ====================

    @Transactional(readOnly = true)
    public PagedResponse<DataDtos.ExchangeRateResponse> searchExchange(String currency, LocalDate from,
                                                                       LocalDate to, int page, int size) {
        Page<ExchangeRate> result = exchangeRepo.search(blankToNull(currency), from, to, PageRequest.of(page, size));
        return new PagedResponse<>(result.map(this::toExchangeDto).getContent(),
            result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    @Transactional
    @Audited(action = "CREATE_EXCHANGE_RATE", module = "DATA", description = "Thêm mới tỷ giá ngoại tệ")
    public DataDtos.ExchangeRateResponse createExchange(DataDtos.ExchangeRateRequest req) {
        if (exchangeRepo.existsByCurrencyCodeAndEffectiveDate(req.currencyCode().toUpperCase(), req.effectiveDate())) {
            throw ApiException.conflict("Đã tồn tại tỷ giá " + req.currencyCode().toUpperCase()
                + " cho ngày " + req.effectiveDate());
        }
        ExchangeRate entity = ExchangeRate.builder()
            .currencyCode(req.currencyCode().toUpperCase())
            .buyRate(req.buyRate())
            .sellRate(req.sellRate())
            .transferRate(req.transferRate())
            .effectiveDate(req.effectiveDate())
            .createdBy(SecurityContextUtils.currentUserId())
            .build();
        return toExchangeDto(exchangeRepo.save(entity));
    }

    @Transactional
    @Audited(action = "UPDATE_EXCHANGE_RATE", module = "DATA", description = "Cập nhật tỷ giá ngoại tệ")
    public DataDtos.ExchangeRateResponse updateExchange(Long id, DataDtos.ExchangeRateRequest req) {
        ExchangeRate entity = exchangeRepo.findById(id)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy tỷ giá có mã " + id));
        // Nếu đổi currency/date sang cặp đã tồn tại khác id -> chặn
        exchangeRepo.findByCurrencyCodeAndEffectiveDate(
                req.currencyCode().toUpperCase(), req.effectiveDate())
            .filter(other -> !other.getId().equals(id))
            .ifPresent(other -> {
                throw ApiException.conflict("Đã tồn tại tỷ giá " + req.currencyCode().toUpperCase()
                    + " cho ngày " + req.effectiveDate());
            });
        entity.setCurrencyCode(req.currencyCode().toUpperCase());
        entity.setBuyRate(req.buyRate());
        entity.setSellRate(req.sellRate());
        entity.setTransferRate(req.transferRate());
        entity.setEffectiveDate(req.effectiveDate());
        return toExchangeDto(exchangeRepo.save(entity));
    }

    @Transactional
    @Audited(action = "DELETE_EXCHANGE_RATE", module = "DATA", description = "Xóa tỷ giá ngoại tệ")
    public void deleteExchange(Long id) {
        if (!exchangeRepo.existsById(id)) {
            throw ApiException.notFound("Không tìm thấy tỷ giá có mã " + id);
        }
        exchangeRepo.deleteById(id);
    }

    /** Import Excel/CSV: upsert theo (currencyCode, effectiveDate). */
    @Transactional
    public Map<String, Object> importExchange(MultipartFile file) {
        var parsed = parser.parseExchange(file, SecurityContextUtils.currentUserId());
        int updated = 0;
        for (ExchangeRate row : parsed.rows()) {
            var existing = exchangeRepo.findByCurrencyCodeAndEffectiveDate(row.getCurrencyCode(), row.getEffectiveDate());
            if (existing.isPresent()) {
                ExchangeRate e = existing.get();
                e.setBuyRate(row.getBuyRate());
                e.setSellRate(row.getSellRate());
                e.setTransferRate(row.getTransferRate());
                exchangeRepo.save(e);
                updated++;
            } else {
                exchangeRepo.save(row);
            }
        }
        return importSummary(parsed.rows().size(), parsed.rows().size() - updated, updated, parsed.skipped());
    }

    // ==================== GIÁ VÀNG ====================

    @Transactional(readOnly = true)
    public PagedResponse<DataDtos.GoldRateResponse> searchGold(String type, LocalDate from,
                                                               LocalDate to, int page, int size) {
        Page<GoldRate> result = goldRepo.search(blankToNull(type), from, to, PageRequest.of(page, size));
        return new PagedResponse<>(result.map(this::toGoldDto).getContent(),
            result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    @Transactional
    @Audited(action = "CREATE_GOLD_RATE", module = "DATA", description = "Thêm mới giá vàng")
    public DataDtos.GoldRateResponse createGold(DataDtos.GoldRateRequest req) {
        return toGoldDto(goldRepo.save(GoldRate.builder()
            .goldType(req.goldType())
            .buyPrice(req.buyPrice())
            .sellPrice(req.sellPrice())
            .effectiveDate(req.effectiveDate())
            .createdBy(SecurityContextUtils.currentUserId())
            .build()));
    }

    @Transactional
    @Audited(action = "UPDATE_GOLD_RATE", module = "DATA", description = "Cập nhật giá vàng")
    public DataDtos.GoldRateResponse updateGold(Long id, DataDtos.GoldRateRequest req) {
        GoldRate entity = goldRepo.findById(id)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy bản ghi giá vàng có mã " + id));
        entity.setGoldType(req.goldType());
        entity.setBuyPrice(req.buyPrice());
        entity.setSellPrice(req.sellPrice());
        entity.setEffectiveDate(req.effectiveDate());
        return toGoldDto(goldRepo.save(entity));
    }

    @Transactional
    @Audited(action = "DELETE_GOLD_RATE", module = "DATA", description = "Xóa giá vàng")
    public void deleteGold(Long id) {
        if (!goldRepo.existsById(id)) {
            throw ApiException.notFound("Không tìm thấy bản ghi giá vàng có mã " + id);
        }
        goldRepo.deleteById(id);
    }

    @Transactional
    public Map<String, Object> importGold(MultipartFile file) {
        var parsed = parser.parseGold(file, SecurityContextUtils.currentUserId());
        parsed.rows().forEach(goldRepo::save); // giá vàng cho phép nhiều dòng cùng loại/ngày
        return importSummary(parsed.rows().size(), parsed.rows().size(), 0, parsed.skipped());
    }

    // ==================== LÃI SUẤT ====================

    @Transactional(readOnly = true)
    public PagedResponse<DataDtos.InterestRateResponse> searchInterest(String product, LocalDate from,
                                                                       LocalDate to, int page, int size) {
        Page<InterestRate> result = interestRepo.search(blankToNull(product), from, to, PageRequest.of(page, size));
        return new PagedResponse<>(result.map(this::toInterestDto).getContent(),
            result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    @Transactional
    @Audited(action = "CREATE_INTEREST_RATE", module = "DATA", description = "Thêm mới lãi suất")
    public DataDtos.InterestRateResponse createInterest(DataDtos.InterestRateRequest req) {
        return toInterestDto(interestRepo.save(InterestRate.builder()
            .productCode(req.productCode().toUpperCase())
            .termMonths(req.termMonths())
            .ratePercentage(req.ratePercentage())
            .effectiveDate(req.effectiveDate())
            .createdBy(SecurityContextUtils.currentUserId())
            .build()));
    }

    @Transactional
    @Audited(action = "UPDATE_INTEREST_RATE", module = "DATA", description = "Cập nhật lãi suất")
    public DataDtos.InterestRateResponse updateInterest(Long id, DataDtos.InterestRateRequest req) {
        InterestRate entity = interestRepo.findById(id)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy bản ghi lãi suất có mã " + id));
        entity.setProductCode(req.productCode().toUpperCase());
        entity.setTermMonths(req.termMonths());
        entity.setRatePercentage(req.ratePercentage());
        entity.setEffectiveDate(req.effectiveDate());
        return toInterestDto(interestRepo.save(entity));
    }

    @Transactional
    @Audited(action = "DELETE_INTEREST_RATE", module = "DATA", description = "Xóa lãi suất")
    public void deleteInterest(Long id) {
        if (!interestRepo.existsById(id)) {
            throw ApiException.notFound("Không tìm thấy bản ghi lãi suất có mã " + id);
        }
        interestRepo.deleteById(id);
    }

    @Transactional
    public Map<String, Object> importInterest(MultipartFile file) {
        var parsed = parser.parseInterest(file, SecurityContextUtils.currentUserId());
        parsed.rows().forEach(interestRepo::save);
        return importSummary(parsed.rows().size(), parsed.rows().size(), 0, parsed.skipped());
    }

    // ==================== helpers ====================

    private Map<String, Object> importSummary(int total, int inserted, int updated, int skipped) {
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalRows", total);
        summary.put("inserted", inserted);
        summary.put("updated", updated);
        summary.put("skipped", skipped);
        return summary;
    }

    private String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private DataDtos.ExchangeRateResponse toExchangeDto(ExchangeRate e) {
        return DataDtos.ExchangeRateResponse.builder()
            .id(e.getId()).currencyCode(e.getCurrencyCode())
            .buyRate(e.getBuyRate()).sellRate(e.getSellRate()).transferRate(e.getTransferRate())
            .effectiveDate(e.getEffectiveDate())
            .createdBy(e.getCreatedBy()).createdByName(userRepository.findById(e.getCreatedBy())
                .map(u -> u.getFullName()).orElse(null))
            .build();
    }

    private DataDtos.GoldRateResponse toGoldDto(GoldRate g) {
        return DataDtos.GoldRateResponse.builder()
            .id(g.getId()).goldType(g.getGoldType())
            .buyPrice(g.getBuyPrice()).sellPrice(g.getSellPrice())
            .effectiveDate(g.getEffectiveDate())
            .createdBy(g.getCreatedBy()).createdByName(userRepository.findById(g.getCreatedBy())
                .map(u -> u.getFullName()).orElse(null))
            .build();
    }

    private DataDtos.InterestRateResponse toInterestDto(InterestRate i) {
        return DataDtos.InterestRateResponse.builder()
            .id(i.getId()).productCode(i.getProductCode())
            .termMonths(i.getTermMonths()).ratePercentage(i.getRatePercentage())
            .effectiveDate(i.getEffectiveDate())
            .createdBy(i.getCreatedBy()).createdByName(userRepository.findById(i.getCreatedBy())
                .map(u -> u.getFullName()).orElse(null))
            .build();
    }
}
