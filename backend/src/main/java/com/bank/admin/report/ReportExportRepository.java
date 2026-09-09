package com.bank.admin.report;

import com.bank.admin.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReportExportRepository extends JpaRepository<ReportExport, Long> {

    /** Lịch sử xuất kèm tên user. */
    @Query("""
        SELECT r FROM ReportExport r
        WHERE (:userId IS NULL OR r.userId = :userId)
        ORDER BY r.exportedAt DESC
        """)
    Page<ReportExport> findHistory(@Param("userId") Long userId, Pageable pageable);

    /** Tên user hiển thị ở trang lịch sử (query riêng tránh join phức tạp). */
    @Query("SELECT u.fullName FROM User u WHERE u.id = :userId")
    String findUserFullName(@Param("userId") Long userId);
}
