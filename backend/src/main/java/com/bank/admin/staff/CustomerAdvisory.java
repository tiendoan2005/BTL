package com.bank.admin.staff;

import com.bank.admin.approval.Customer;
import com.bank.admin.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "customer_advisories")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class CustomerAdvisory {

    public enum Status { CONSULTED, FOLLOW_UP, COMPLETED, CANCELLED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "advisory_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", nullable = false)
    private User staff;

    @Column(name = "product_type", nullable = false, length = 100)
    private String productType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('CONSULTED','FOLLOW_UP','COMPLETED','CANCELLED')")
    @Builder.Default
    private Status status = Status.CONSULTED;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
