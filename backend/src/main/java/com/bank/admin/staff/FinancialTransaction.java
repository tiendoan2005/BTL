package com.bank.admin.staff;

import com.bank.admin.approval.Customer;
import com.bank.admin.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "financial_transactions")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class FinancialTransaction {

    public enum Status { SUCCESS, FAILED, PENDING_APPROVAL }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Long id;

    @Column(name = "transaction_code", nullable = false, unique = true, length = 50)
    private String transactionCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_customer_id")
    private Customer senderCustomer;

    @Column(name = "receiver_account_number", nullable = false, length = 50)
    private String receiverAccountNumber;

    @Column(name = "receiver_name", nullable = false, length = 100)
    private String receiverName;

    @Column(name = "bank_name", length = 100)
    @Builder.Default
    private String bankName = "INTERNAL";

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal fee = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by_staff_id", nullable = false)
    private User processedByStaff;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('SUCCESS','FAILED','PENDING_APPROVAL')")
    @Builder.Default
    private Status status = Status.SUCCESS;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
