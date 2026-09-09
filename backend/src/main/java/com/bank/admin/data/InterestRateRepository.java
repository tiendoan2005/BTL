package com.bank.admin.data;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;

public interface InterestRateRepository extends JpaRepository<InterestRate, Long> {

    @Query("""
        SELECT i FROM InterestRate i
        WHERE (:product IS NULL OR i.productCode LIKE CONCAT('%', :product, '%'))
          AND (:from IS NULL OR i.effectiveDate >= :from)
          AND (:to IS NULL OR i.effectiveDate <= :to)
        ORDER BY i.effectiveDate DESC, i.productCode ASC, i.termMonths ASC
        """)
    Page<InterestRate> search(@Param("product") String product,
                              @Param("from") LocalDate from,
                              @Param("to") LocalDate to,
                              Pageable pageable);
}
