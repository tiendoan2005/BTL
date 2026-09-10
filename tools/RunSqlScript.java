package tools;

import java.io.BufferedReader;
import java.io.FileReader;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class RunSqlScript {
    public static void main(String[] args) {
        String host = System.getenv("DB_HOST");
        if (host == null || host.isBlank()) host = "100.86.222.38";
        String user = System.getenv("DB_USERNAME");
        if (user == null || user.isBlank()) user = "root";
        String pass = System.getenv("DB_PASSWORD");
        if (pass == null || pass.isBlank()) pass = "1";

        String url = "jdbc:mysql://" + host + ":3306/admin_portal_db?useUnicode=true&characterEncoding=utf8&allowPublicKeyRetrieval=true&useSSL=false";
        String sqlFile = "db/seed_more_data.sql";

        System.out.println("Dang ket noi toi MySQL: " + url + " voi user=" + user);

        try (Connection conn = DriverManager.getConnection(url, user, pass);
             BufferedReader reader = new BufferedReader(new FileReader(sqlFile));
             Statement stmt = conn.createStatement()) {

            StringBuilder sb = new StringBuilder();
            String line;
            int count = 0;

            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                if (trimmed.startsWith("--") || trimmed.isEmpty()) {
                    continue;
                }
                sb.append(line).append("\n");
                if (trimmed.endsWith(";")) {
                    String sql = sb.toString().trim();
                    if (sql.endsWith(";")) {
                        sql = sql.substring(0, sql.length() - 1);
                    }
                    if (!sql.isEmpty() && !sql.equalsIgnoreCase("USE admin_portal_db")) {
                        try {
                            stmt.execute(sql);
                            count++;
                        } catch (Exception ex) {
                            System.err.println("Canh bao o cau lenh " + count + ": " + ex.getMessage());
                        }
                    }
                    sb.setLength(0);
                }
            }

            System.out.println("Thuc thi thanh cong " + count + " khoi cau lenh SQL vao co so du lieu admin_portal_db!");

        } catch (Exception e) {
            System.err.println("Loi khi thuc thi script: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
