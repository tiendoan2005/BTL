package com.bank.admin.approval;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "loan_schedules")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class LoanSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "schedule_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_app_id", nullable = false)
    private LoanApplicationDetail loanApplication;

    @Column(name = "period_number", nullable = false)
    private Integer periodNumber;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "principal_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal principalAmount;

    @Column(name = "interest_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal interestAmount;

    @Column(name = "total_payment", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalPayment;
}
