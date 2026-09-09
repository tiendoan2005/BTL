package com.bank.admin.data;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;

public interface GoldRateRepository extends JpaRepository<GoldRate, Long> {

    @Query("""
        SELECT g FROM GoldRate g
        WHERE (:type IS NULL OR g.goldType LIKE CONCAT('%', :type, '%'))
          AND (:from IS NULL OR g.effectiveDate >= :from)
          AND (:to IS NULL OR g.effectiveDate <= :to)
        ORDER BY g.effectiveDate DESC, g.goldType ASC
        """)
    Page<GoldRate> search(@Param("type") String type,
                          @Param("from") LocalDate from,
                          @Param("to") LocalDate to,
                          Pageable pageable);
}
