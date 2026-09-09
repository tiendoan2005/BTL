package com.bank.admin.data;

import com.bank.admin.common.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

/**
 * Parser Excel/CSV cho import hàng loạt.
 * Mỗi sheet: dòng đầu là header, các dòng sau:
 *   Tỷ giá:    currencyCode | buy | sell | transfer | effectiveDate(yyyy-MM-dd hoặc dd/MM/yyyy)
 *   Giá vàng:  goldType     | buy | sell | effectiveDate
 *   Lãi suất:  productCode  | termMonths | ratePercentage | effectiveDate
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RateDataImportParser {

    public record ParsedRates<T>(List<T> rows, int skipped) {}

    public ParsedRates<ExchangeRate> parseExchange(MultipartFile file, Long userId) {
        return parse(file, row -> {
            String code = text(row, 0);
            if (code.isEmpty()) return null;
            LocalDate date = date(row, 4);
            if (date == null) throw badRow(row.getRowNum(), "thiếu ngày hiệu lực");
            return ExchangeRate.builder()
                .currencyCode(code.toUpperCase())
                .buyRate(decimal(row, 1))
                .sellRate(decimal(row, 2))
                .transferRate(decimal(row, 3))
                .effectiveDate(date)
                .createdBy(userId)
                .build();
        });
    }

    public ParsedRates<GoldRate> parseGold(MultipartFile file, Long userId) {
        return parse(file, row -> {
            String type = text(row, 0);
            if (type.isEmpty()) return null;
            LocalDate date = date(row, 3);
            if (date == null) throw badRow(row.getRowNum(), "thiếu ngày hiệu lực");
            return GoldRate.builder()
                .goldType(type)
                .buyPrice(decimal(row, 1))
                .sellPrice(decimal(row, 2))
                .effectiveDate(date)
                .createdBy(userId)
                .build();
        });
    }

    public ParsedRates<InterestRate> parseInterest(MultipartFile file, Long userId) {
        return parse(file, row -> {
            String code = text(row, 0);
            if (code.isEmpty()) return null;
            LocalDate date = date(row, 3);
            if (date == null) throw badRow(row.getRowNum(), "thiếu ngày hiệu lực");
            double term = numeric(row, 1);
            if (term <= 0) throw badRow(row.getRowNum(), "kỳ hạn không hợp lệ");
            return InterestRate.builder()
                .productCode(code.toUpperCase())
                .termMonths((int) term)
                .ratePercentage(BigDecimal.valueOf(numeric(row, 2)))
                .effectiveDate(date)
                .createdBy(userId)
                .build();
        });
    }

    // ---------- helpers ----------

    private interface RowMapper<T> {
        T map(Row row);
    }

    private <T> ParsedRates<T> parse(MultipartFile file, RowMapper<T> mapper) {
        try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {
            List<T> rows = new ArrayList<>();
            int skipped = 0;
            Sheet sheet = wb.getSheetAt(0);
            for (int i = sheet.getFirstRowNum() + 1; i <= sheet.getLastRowNum(); i++) { // bỏ header
                Row row = sheet.getRow(i);
                if (row == null) continue;
                try {
                    T item = mapper.map(row);
                    if (item == null) skipped++; // dòng trống
                    else rows.add(item);
                } catch (IllegalArgumentException e) {
                    log.warn("Bỏ qua dòng {} khi import: {}", i + 1, e.getMessage());
                    skipped++;
                }
            }
            if (rows.isEmpty() && skipped == 0) {
                throw ApiException.badRequest("File không có dữ liệu để import");
            }
            return new ParsedRates<>(rows, skipped);
        } catch (ApiException e) {
            throw e;
        } catch (IOException | org.apache.poi.openxml4j.exceptions.NotOfficeXmlFileException e) {
            throw ApiException.badRequest("File không đúng định dạng Excel (.xlsx/.xls)");
        } catch (Exception e) {
            log.error("Lỗi đọc file import", e);
            throw ApiException.badRequest("Không đọc được file, vui lòng kiểm tra lại định dạng");
        }
    }

    private IllegalArgumentException badRow(int rowNum, String reason) {
        return new IllegalArgumentException("Dòng " + (rowNum + 1) + ": " + reason);
    }

    private String text(Row row, int idx) {
        Cell cell = row.getCell(idx);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                double d = cell.getNumericCellValue();
                yield d == Math.floor(d) ? String.valueOf((long) d) : String.valueOf(d);
            }
            case FORMULA -> cell.getCachedFormulaResultType() == CellType.STRING
                ? cell.getStringCellValue().trim() : "";
            default -> "";
        };
    }

    private BigDecimal decimal(Row row, int idx) {
        Cell cell = row.getCell(idx);
        if (cell == null) throw new IllegalArgumentException("thiếu cột số");
        return switch (cell.getCellType()) {
            case NUMERIC -> BigDecimal.valueOf(cell.getNumericCellValue());
            case STRING -> {
                String s = cell.getStringCellValue().replace(",", "").trim();
                try {
                    yield new BigDecimal(s);
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("giá trị số không hợp lệ: " + s);
                }
            }
            default -> throw new IllegalArgumentException("thiếu cột số");
        };
    }

    private double numeric(Row row, int idx) {
        return decimal(row, idx).doubleValue();
    }

    /** Chấp nhận Excel date (numeric), yyyy-MM-dd hoặc dd/MM/yyyy. */
    private LocalDate date(Row row, int idx) {
        Cell cell = row.getCell(idx);
        if (cell == null) return null;
        try {
            if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
                return cell.getDateCellValue().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
            }
            String s = text(row, idx);
            if (s.isEmpty()) return null;
            if (s.matches("\\d{4}-\\d{2}-\\d{2}")) return LocalDate.parse(s);
            if (s.matches("\\d{1,2}/\\d{1,2}/\\d{4}")) {
                String[] p = s.split("/");
                return LocalDate.of(Integer.parseInt(p[2]), Integer.parseInt(p[1]), Integer.parseInt(p[0]));
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }
}
