import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.FileOutputStream;

/** Tiện ích tạo file xlsx mẫu để test import (chạy tay, không đóng gói). */
public class MakeTestXlsx {
    public static void main(String[] args) throws Exception {
        String out = args.length > 0 ? args[0] : "exchange-import.xlsx";
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Rates");
            Row header = sheet.createRow(0);
            String[] heads = {"currencyCode", "buy", "sell", "transfer", "effectiveDate"};
            for (int i = 0; i < heads.length; i++) header.createCell(i).setCellValue(heads[i]);

            Object[][] rows = {
                {"GBP", 32500.0, 33400.0, 32800.0, "2026-08-26"},
                {"SGD", 18700.0, 19100.0, 18800.0, "2026-08-26"},
                {"USD", 25410.0, 25820.0, 25440.0, "2026-08-26"},
            };
            int r = 1;
            for (Object[] data : rows) {
                Row row = sheet.createRow(r++);
                row.createCell(0).setCellValue((String) data[0]);
                row.createCell(1).setCellValue((Double) data[1]);
                row.createCell(2).setCellValue((Double) data[2]);
                row.createCell(3).setCellValue((Double) data[3]);
                row.createCell(4).setCellValue((String) data[4]);
            }
            try (FileOutputStream fos = new FileOutputStream(out)) {
                wb.write(fos);
            }
        }
        System.out.println("Created " + out);
    }
}
