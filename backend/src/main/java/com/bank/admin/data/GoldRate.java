package com.bank.admin.data;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/** Giá vàng mua/bán theo ngày hiệu lực (bảng gold_rates). */
@Entity
@Table(name = "gold_rates")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class GoldRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "gold_id")
    private Long id;

    /** Loại vàng: SJC, 24K, 18K... */
    @Column(name = "gold_type", nullable = false, length = 50)
    private String goldType;

    @Column(name = "buy_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal buyPrice;

    @Column(name = "sell_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal sellPrice;

    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
