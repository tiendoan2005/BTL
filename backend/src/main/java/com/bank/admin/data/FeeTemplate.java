package com.bank.admin.data;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/** Biểu mẫu/biểu phí đính kèm file (bảng fee_templates). */
@Entity
@Table(name = "fee_templates")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class FeeTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "template_id")
    private Long id;

    @Column(nullable = false)
    private String title;

    /** Đường dẫn file đã upload, vd /uploads/fees/xxx.xlsx. */
    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_type", length = 50)
    private String fileType; // EXCEL, PDF...

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
