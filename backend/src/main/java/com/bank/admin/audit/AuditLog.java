package com.bank.admin.audit;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/** Bảng audit_logs - ghi vết mọi thao tác ghi của user. */
@Entity
@Table(name = "audit_logs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {

    public enum Status { SUCCESS, FAILED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long id;

    /** FK tới users(user_id); null = action hệ thống/đăng nhập thất bại. */
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "action_type", nullable = false, length = 100)
    private String actionType; // CREATE_EXCHANGE_RATE, UPDATE_GOLD_RATE, ...

    @Column(name = "module_name", nullable = false, length = 50)
    private String moduleName; // DATA, APPROVAL, REPORT, SYSTEM, CMS, AUTH

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('SUCCESS','FAILED')")
    private Status status;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** JSON string trạng thái trước khi đổi (null với CREATE). */
    @Column(name = "payload_before", columnDefinition = "JSON")
    private String payloadBefore;

    /** JSON string trạng thái sau khi đổi. */
    @Column(name = "payload_after", columnDefinition = "JSON")
    private String payloadAfter;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
