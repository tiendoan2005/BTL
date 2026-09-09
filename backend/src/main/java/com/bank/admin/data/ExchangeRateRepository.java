package com.bank.admin.data;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ExchangeRateRepository extends JpaRepository<ExchangeRate, Long> {

    boolean existsByCurrencyCodeAndEffectiveDate(String currencyCode, LocalDate effectiveDate);

    Optional<ExchangeRate> findByCurrencyCodeAndEffectiveDate(String currencyCode, LocalDate effectiveDate);

    /** Filter FE: mã tiền tệ + khoảng ngày hiệu lực. */
    @Query("""
        SELECT e FROM ExchangeRate e
        WHERE (:currency IS NULL OR e.currencyCode LIKE CONCAT('%', :currency, '%'))
          AND (:from IS NULL OR e.effectiveDate >= :from)
          AND (:to IS NULL OR e.effectiveDate <= :to)
        ORDER BY e.effectiveDate DESC, e.currencyCode ASC
        """)
    Page<ExchangeRate> search(@Param("currency") String currency,
                              @Param("from") LocalDate from,
                              @Param("to") LocalDate to,
                              Pageable pageable);

    List<ExchangeRate> findByCurrencyCodeOrderByEffectiveDateAsc(String currencyCode);
}
