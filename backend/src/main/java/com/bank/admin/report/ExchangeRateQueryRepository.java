package com.bank.admin.report;

import com.bank.admin.data.ExchangeRate;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

/** Query chuyên đọc cho biểu đồ tỷ giá (không đụng repository CRUD của module DATA). */
public interface ExchangeRateQueryRepository extends Repository<ExchangeRate, Long> {

    /** Chuỗi điểm tỷ giá bán theo ngày của các tiền tệ chính, phục vụ line chart. */
    @Query("""
        SELECT e FROM ExchangeRate e
        WHERE (:from IS NULL OR e.effectiveDate >= :from)
          AND (:to IS NULL OR e.effectiveDate <= :to)
          AND e.currencyCode IN ('USD','EUR','JPY','GBP','SGD')
        ORDER BY e.effectiveDate ASC
        """)
    List<ExchangeRate> findRateTrend(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
