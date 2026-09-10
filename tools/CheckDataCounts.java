package tools;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class CheckDataCounts {
    public static void main(String[] args) {
        String host = System.getenv("DB_HOST");
        if (host == null || host.isBlank()) host = "100.86.222.38";
        String user = System.getenv("DB_USERNAME");
        if (user == null || user.isBlank()) user = "root";
        String pass = System.getenv("DB_PASSWORD");
        if (pass == null || pass.isBlank()) pass = "1";

        String url = "jdbc:mysql://" + host + ":3306/admin_portal_db?useUnicode=true&characterEncoding=utf8&allowPublicKeyRetrieval=true&useSSL=false";

        String[] tables = {
            "users",
            "customers",
            "chatbot_appointments",
            "exchange_rates",
            "gold_rates",
            "interest_rates",
            "fee_templates",
            "financial_transactions",
            "customer_advisories",
            "support_tickets",
            "dispute_requests",
            "applications",
            "posts",
            "audit_logs"
        };

        try (Connection conn = DriverManager.getConnection(url, user, pass);
             Statement stmt = conn.createStatement()) {

            System.out.println("=== THỐNG KÊ SỐ LƯỢNG BẢN GHI TRONG DATABASE admin_portal_db ===");
            for (String table : tables) {
                try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM " + table)) {
                    if (rs.next()) {
                        System.out.printf("- Bảng %-25s : %3d bản ghi\n", table, rs.getInt(1));
                    }
                } catch (Exception e) {
                    System.out.printf("- Bảng %-25s : Chưa có / Lỗi (%s)\n", table, e.getMessage());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
