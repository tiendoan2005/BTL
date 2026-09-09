package com.bank.admin.user;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    public enum Status { ACTIVE, INACTIVE, LOCKED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    @NotBlank
    private String username;

    @Column(name = "password_hash", nullable = false)
    @NotBlank
    private String passwordHash;

    @Column(nullable = false, unique = true, length = 100)
    @NotBlank
    private String email;

    @Column(name = "full_name", nullable = false, length = 100)
    @NotBlank
    private String fullName;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('ACTIVE','INACTIVE','LOCKED')")
    @Builder.Default
    private Status status = Status.ACTIVE;

    /** Base64 secret dùng cho OTP (TOTP hoặc OTP dev-mode). */
    @Column(name = "otp_secret", length = 100)
    private String otpSecret;

    /** Hạn dùng của OTP đang chờ xác thực. */
    @Column(name = "otp_expiry")
    private LocalDateTime otpExpiry;

    @Column(name = "last_login")
    private Instant lastLogin;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id"))
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    public boolean isActive() {
        return status == Status.ACTIVE;
    }
}
