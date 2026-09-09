package com.bank.admin.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    /** Tìm kiếm kết hợp: action, module, user, khoảng thời gian (cho trang Audit Log viewer). */
    @Query("""
        SELECT a FROM AuditLog a
        WHERE (:action IS NULL OR a.actionType LIKE CONCAT('%', :action, '%'))
          AND (:module IS NULL OR a.moduleName = :module)
          AND (:userId IS NULL OR a.userId = :userId)
          AND (:from IS NULL OR a.createdAt >= :from)
          AND (:to IS NULL OR a.createdAt <= :to)
        ORDER BY a.createdAt DESC
        """)
    Page<AuditLog> search(@Param("action") String action,
                          @Param("module") String module,
                          @Param("userId") Long userId,
                          @Param("from") Instant from,
                          @Param("to") Instant to,
                          Pageable pageable);
}
