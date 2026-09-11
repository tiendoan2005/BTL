package tools;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class CheckRolePerms {
    public static void main(String[] args) {
        String host = System.getenv("DB_HOST");
        if (host == null || host.isBlank()) host = "100.86.222.38";
        String user = System.getenv("DB_USERNAME");
        if (user == null || user.isBlank()) user = "root";
        String pass = System.getenv("DB_PASSWORD");
        if (pass == null || pass.isBlank()) pass = "1";

        String url = "jdbc:mysql://" + host + ":3306/admin_portal_db?useUnicode=true&characterEncoding=utf8&allowPublicKeyRetrieval=true&useSSL=false";

        try (Connection conn = DriverManager.getConnection(url, user, pass);
             Statement stmt = conn.createStatement()) {

            System.out.println("=== ROLES VÀ PERMISSIONS ===");
            ResultSet rs = stmt.executeQuery("""
                SELECT r.role_code, r.role_name, p.permission_code, p.permission_name
                FROM roles r
                JOIN role_permissions rp ON r.role_id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.permission_id
                ORDER BY r.role_id, p.permission_id
            """);

            while (rs.next()) {
                System.out.printf("%-15s | %-20s | %-25s | %s\n",
                    rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4));
            }

            System.out.println("\n=== USERS VÀ ROLES ===");
            rs = stmt.executeQuery("""
                SELECT u.username, u.full_name, r.role_code
                FROM users u
                LEFT JOIN user_roles ur ON u.user_id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.role_id
                ORDER BY u.user_id
            """);
            while (rs.next()) {
                System.out.printf("%-15s | %-20s | %s\n",
                    rs.getString(1), rs.getString(2), rs.getString(3));
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
