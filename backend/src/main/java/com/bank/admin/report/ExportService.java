package com.bank.admin.report;

import com.bank.admin.common.ApiException;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.pdf.RGBColor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Xuất báo cáo hồ sơ ra 3 định dạng: Excel (.xlsx), PDF, CSV.
 * File lưu vào {app.upload.dir}/reports và trả về đường dẫn public /uploads/reports/...
 */
@Slf4j
@Service
public class ExportService {

    private static final String[] HEADERS = {
        "Mã hồ sơ", "Khách hàng", "Loại", "Số tiền (VNĐ)", "Trạng thái", "Ngày tạo"
    };

    @Value("${app.upload.dir}")
    private String uploadDir;

    // ==================== EXCEL ====================

    public Path exportExcel(List<ReportDtos.ApplicationRow> rows) {
        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Bao cao ho so");

            CellStyle headerStyle = wb.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            Row head = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell c = head.createCell(i);
                c.setCellValue(HEADERS[i]);
                c.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, i == 1 ? 7000 : 4500);
            }

            int r = 1;
            for (ReportDtos.ApplicationRow row : rows) {
                Row line = sheet.createRow(r++);
                line.createCell(0).setCellValue(row.applicationCode());
                line.createCell(1).setCellValue(row.customerName());
                line.createCell(2).setCellValue(row.type());
                line.createCell(3).setCellValue(row.requestedAmount() != null
                    ? row.requestedAmount().doubleValue() : 0);
                line.createCell(4).setCellValue(row.status());
                line.createCell(5).setCellValue(row.createdAt());
            }
            wb.write(bos);
            return save(bos.toByteArray(), "xlsx");
        } catch (IOException e) {
            throw exportFailed(e);
        }
    }

    // ==================== PDF (OpenPDF + font hệ thống hỗ trợ tiếng Việt) ====================

    public Path exportPdf(List<ReportDtos.ApplicationRow> rows) {
        try (ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4.rotate(), 24, 24, 32, 32);
            PdfWriter.getInstance(doc, bos);
            doc.open();

            // Dùng font TTF của Windows (arial/tahoma) với encoding IDENTITY_H
            // để glyph tiếng Việt nhúng thẳng vào file PDF.
            BaseFont baseFont = loadVietnameseFont();
            Font titleFont = new Font(baseFont, 16, Font.BOLD);
            Font headerFont = new Font(baseFont, 10, Font.BOLD, new RGBColor(255, 255, 255));
            Font cellFont = new Font(baseFont, 9);

            doc.add(new Paragraph("Báo cáo hồ sơ tín dụng", titleFont));
            doc.add(new Paragraph("Xuất lúc: "
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")),
                new Font(baseFont, 9)));
            doc.add(Chunk.NEWLINE);

            PdfPTable table = new PdfPTable(HEADERS.length);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{2.2f, 2.8f, 2f, 2.5f, 2.2f, 2f});

            for (String h : HEADERS) {
                PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
                cell.setBackgroundColor(new RGBColor(21, 101, 192));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(6);
                table.addCell(cell);
            }
            for (ReportDtos.ApplicationRow row : rows) {
                table.addCell(padded(row.applicationCode(), cellFont));
                table.addCell(padded(row.customerName(), cellFont));
                table.addCell(padded(row.type(), cellFont));
                table.addCell(padded(row.requestedAmount() != null
                    ? row.requestedAmount().toPlainString() : "-", cellFont));
                table.addCell(padded(row.status(), cellFont));
                table.addCell(padded(row.createdAt(), cellFont));
            }
            doc.add(table);
            doc.close();
            return save(bos.toByteArray(), "pdf");
        } catch (Exception e) {
            throw exportFailed(e);
        }
    }

    /** Tìm font TTF hỗ trợ tiếng Việt trên Windows, fallback Helvetica (có thể mất dấu). */
    private BaseFont loadVietnameseFont() {
        String[] candidates = {
            "C:/Windows/Fonts/arial.ttf",
            "C:/Windows/Fonts/segoeui.ttf",
            "C:/Windows/Fonts/tahoma.ttf",
        };
        for (String path : candidates) {
            try {
                return BaseFont.createFont(path, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            } catch (Exception ignored) { /* thử font kế tiếp */ }
        }
        log.warn("Không tìm thấy font TTF hệ thống - PDF có thể thiếu glyph tiếng Việt");
        try {
            return BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
        } catch (Exception e) {
            throw new IllegalStateException("Không khởi tạo được font PDF", e);
        }
    }

    private PdfPCell padded(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text == null ? "" : text, font));
        cell.setPadding(5);
        return cell;
    }

    // ==================== CSV ====================

    public Path exportCsv(List<ReportDtos.ApplicationRow> rows) {
        StringBuilder sb = new StringBuilder("\uFEFF"); // BOM để Excel mở UTF-8 đúng dấu
        sb.append(String.join(",", HEADERS)).append("\r\n");
        for (ReportDtos.ApplicationRow row : rows) {
            sb.append(csvEscape(row.applicationCode())).append(',')
                .append(csvEscape(row.customerName())).append(',')
                .append(csvEscape(row.type())).append(',')
                .append(csvEscape(row.requestedAmount() != null
                    ? row.requestedAmount().toPlainString() : ""))
                .append(',')
                .append(csvEscape(row.status())).append(',')
                .append(csvEscape(row.createdAt()))
                .append("\r\n");
        }
        return save(sb.toString().getBytes(StandardCharsets.UTF_8), "csv");
    }

    private String csvEscape(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    // ==================== lưu file ====================

    /** Ghi file vào {uploadDir}/reports, trả về Path đã ghi. */
    private Path save(byte[] content, String ext) {
        try {
            Path dir = Paths.get(uploadDir, "reports").toAbsolutePath().normalize();
            Files.createDirectories(dir);
            String fileName = "bao-cao-ho-so_"
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"))
                + "_" + Long.toHexString(System.nanoTime() & 0xFFFF) // tránh trùng cùng giây
                + "." + ext;
            Path target = dir.resolve(fileName);
            Files.write(target, content);
            log.info("Đã xuất báo cáo: {}", target);
            return target;
        } catch (IOException e) {
            throw exportFailed(e);
        }
    }

    private ApiException exportFailed(Exception cause) {
        log.error("Xuất báo cáo thất bại", cause);
        return new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
            "Không thể tạo file báo cáo, vui lòng thử lại");
    }
}
