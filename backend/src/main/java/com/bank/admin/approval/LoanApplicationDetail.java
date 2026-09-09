package com.bank.admin.approval;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "loan_applications")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class LoanApplicationDetail {

    public enum Purpose { CONSUMER, AUTO, BUSINESS }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "loan_app_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false, unique = true)
    private Application application;

    @Enumerated(EnumType.STRING)
    @Column(name = "loan_purpose", nullable = false, columnDefinition = "ENUM('CONSUMER','AUTO','BUSINESS')")
    private Purpose loanPurpose;

    @Column(name = "loan_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal loanAmount;

    @Column(name = "loan_term_months", nullable = false)
    private Integer loanTermMonths;

    @Column(name = "interest_rate_percentage", precision = 5, scale = 2)
    private BigDecimal interestRatePercentage;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
