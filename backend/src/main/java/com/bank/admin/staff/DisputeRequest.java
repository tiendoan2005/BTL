package com.bank.admin.staff;

import com.bank.admin.approval.Customer;
import com.bank.admin.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "dispute_requests")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class DisputeRequest {

    public enum Status { PENDING, PROCESSING, APPROVED_REFUND, REJECTED, CLOSED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dispute_id")
    private Long id;

    @Column(name = "dispute_code", nullable = false, unique = true, length = 50)
    private String disputeCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "transaction_code", nullable = false, length = 100)
    private String transactionCode;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('PENDING','PROCESSING','APPROVED_REFUND','REJECTED','CLOSED')")
    @Builder.Default
    private Status status = Status.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "handler_staff_id")
    private User handlerStaff;

    @Column(name = "resolution_note", columnDefinition = "TEXT")
    private String resolutionNote;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
