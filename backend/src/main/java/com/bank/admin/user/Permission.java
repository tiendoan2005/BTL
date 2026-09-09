package com.bank.admin.user;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "permissions")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "permission_id")
    private Integer id;

    /** VD: SYS_MANAGE_USERS, DATA_UPDATE_RATES... dùng làm Spring Security authority */
    @Column(name = "permission_code", nullable = false, unique = true, length = 100, updatable = false)
    @NotBlank
    private String code;

    @Column(name = "permission_name", nullable = false, length = 150)
    @NotBlank
    private String name;

    /** Tên module: System / FluctuatingData / Approval / Report / CMS */
    @Column(name = "module_name", nullable = false, length = 50)
    @NotBlank
    private String moduleName;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
