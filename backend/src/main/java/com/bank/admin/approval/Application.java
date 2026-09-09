package com.bank.admin.approval;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

/** Hồ sơ tín dụng/thẻ (bảng applications). */
@Entity
@Table(name = "applications")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Application {

    public enum Type { LOAN, CARD_ISSUANCE, LIMIT_APPROVAL }

    public enum Status { PENDING, APPROVED, REJECTED, DOCS_REQUIRED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "application_id")
    private Long id;

    /** Mã hồ sơ hiển thị, vd APP-2026-001. */
    @Column(name = "application_code", nullable = false, unique = true, length = 50)
    private String applicationCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Enumerated(EnumType.STRING)
    @Column(name = "application_type", nullable = false, columnDefinition = "ENUM('LOAN','CARD_ISSUANCE','LIMIT_APPROVAL')")
    private Type type;

    @Column(name = "requested_amount", precision = 18, scale = 2)
    private BigDecimal requestedAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('PENDING','APPROVED','REJECTED','DOCS_REQUIRED')")
    @Builder.Default
    private Status status = Status.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
