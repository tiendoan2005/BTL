package com.bank.admin.data;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/** Tỷ giá ngoại tệ theo ngày hiệu lực (bảng exchange_rates). */
@Entity
@Table(name = "exchange_rates")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ExchangeRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rate_id")
    private Long id;

    @Column(name = "currency_code", nullable = false, length = 10)
    private String currencyCode; // USD, EUR, JPY...

    @Column(nullable = false, precision = 18, scale = 4)
    private BigDecimal buyRate;

    @Column(nullable = false, precision = 18, scale = 4)
    private BigDecimal sellRate;

    @Column(name = "transfer_rate", nullable = false, precision = 18, scale = 4)
    private BigDecimal transferRate;

    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
