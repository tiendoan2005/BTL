package com.bank.admin.approval;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ApplicationApprovalRepository extends JpaRepository<ApplicationApproval, Long> {

    /** Lịch sử xử lý mới nhất lên đầu, kèm manager. */
    @Query("""
        SELECT ap FROM ApplicationApproval ap
        JOIN FETCH ap.manager m
        WHERE ap.application.id = :applicationId
        ORDER BY ap.processedAt DESC
        """)
    List<ApplicationApproval> findByApplicationIdWithManager(@Param("applicationId") Long applicationId);
}
