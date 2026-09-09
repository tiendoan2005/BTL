package com.bank.admin.staff;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomerAdvisoryRepository extends JpaRepository<CustomerAdvisory, Long> {

    @Query("""
        SELECT a FROM CustomerAdvisory a
        JOIN FETCH a.customer c
        JOIN FETCH a.staff s
        WHERE (:keyword IS NULL OR c.fullName LIKE CONCAT('%', :keyword, '%')
               OR c.phoneNumber LIKE CONCAT('%', :keyword, '%')
               OR a.productType LIKE CONCAT('%', :keyword, '%'))
          AND (:status IS NULL OR a.status = :status)
        ORDER BY a.id DESC
        """)
    Page<CustomerAdvisory> search(@Param("keyword") String keyword,
                                  @Param("status") CustomerAdvisory.Status status,
                                  Pageable pageable);
}
