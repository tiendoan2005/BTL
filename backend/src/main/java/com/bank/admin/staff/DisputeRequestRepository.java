package com.bank.admin.staff;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DisputeRequestRepository extends JpaRepository<DisputeRequest, Long> {

    @Query("""
        SELECT d FROM DisputeRequest d
        JOIN FETCH d.customer c
        LEFT JOIN FETCH d.handlerStaff s
        WHERE (:keyword IS NULL OR d.disputeCode LIKE CONCAT('%', :keyword, '%')
               OR d.transactionCode LIKE CONCAT('%', :keyword, '%')
               OR c.fullName LIKE CONCAT('%', :keyword, '%'))
          AND (:status IS NULL OR d.status = :status)
        ORDER BY d.id DESC
        """)
    Page<DisputeRequest> search(@Param("keyword") String keyword,
                                @Param("status") DisputeRequest.Status status,
                                Pageable pageable);
}
