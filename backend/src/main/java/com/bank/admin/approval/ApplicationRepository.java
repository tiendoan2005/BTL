package com.bank.admin.approval;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    boolean existsByApplicationCode(String applicationCode);

    /**
     * Tìm kiếm hồ sơ: mã hồ sơ/tên KH, loại, trạng thái.
     * Sắp mặc định: PENDING/DOCS_REQUIRED (cần xử lý) lên trước theo updated_at.
     */
    @Query("""
        SELECT a FROM Application a
        JOIN FETCH a.customer c
        WHERE (:keyword IS NULL OR a.applicationCode LIKE CONCAT('%', :keyword, '%')
               OR c.fullName LIKE CONCAT('%', :keyword, '%'))
          AND (:type IS NULL OR a.type = :type)
          AND (:status IS NULL OR a.status = :status)
        ORDER BY CASE WHEN a.status IN (com.bank.admin.approval.Application.Status.PENDING,
                                        com.bank.admin.approval.Application.Status.DOCS_REQUIRED)
                 THEN 0 ELSE 1 END,
                 a.updatedAt DESC
        """)
    Page<Application> search(@Param("keyword") String keyword,
                             @Param("type") Application.Type type,
                             @Param("status") Application.Status status,
                             Pageable pageable);

    java.util.List<Application> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
}
