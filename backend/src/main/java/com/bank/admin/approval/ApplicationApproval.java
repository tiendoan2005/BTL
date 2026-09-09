package com.bank.admin.approval;

import com.bank.admin.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/** Lịch sử xử lý hồ sơ (bảng application_approvals). */
@Entity
@Table(name = "application_approvals")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ApplicationApproval {

    public enum Action { APPROVED, REJECTED, REQUEST_DOCS }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "approval_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    /** Manager xử lý (FK users). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", nullable = false)
    private User manager;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('APPROVED','REJECTED','REQUEST_DOCS')")
    private Action action;

    /** Lý do từ chối / yêu cầu bổ sung. */
    @Column(name = "reason_note", columnDefinition = "TEXT")
    private String reasonNote;

    @CreationTimestamp
    @Column(name = "processed_at", updatable = false)
    private Instant processedAt;
}
