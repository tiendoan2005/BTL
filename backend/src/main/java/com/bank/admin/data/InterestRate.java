package com.bank.admin.data;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/** Lãi suất theo sản phẩm & kỳ hạn (bảng interest_rates). */
@Entity
@Table(name = "interest_rates")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class InterestRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rate_id")
    private Long id;

    /** Mã sản phẩm: SAVING_ONLINE, LOAN_MORTGAGE... */
    @Column(name = "product_code", nullable = false, length = 50)
    private String productCode;

    /** Kỳ hạn (tháng). */
    @Column(name = "term_months", nullable = false)
    private Integer termMonths;

    @Column(name = "rate_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal ratePercentage;

    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
