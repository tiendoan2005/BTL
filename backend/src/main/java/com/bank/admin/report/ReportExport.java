package com.bank.admin.report;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/** Lịch sử xuất báo cáo (bảng report_exports). */
@Entity
@Table(name = "report_exports")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ReportExport {

    public enum Format { EXCEL, PDF, CSV }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "export_id")
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** Loại báo cáo, vd APPLICATION_SUMMARY, EXCHANGE_RATE_REPORT. */
    @Column(name = "report_type", nullable = false, length = 100)
    private String reportType;

    /** Bộ lọc đã chọn (JSON string): from/to/type... */
    @Column(name = "filter_params", nullable = false, columnDefinition = "JSON")
    private String filterParams;

    @Enumerated(EnumType.STRING)
    @Column(name = "file_format", nullable = false, columnDefinition = "ENUM('EXCEL','PDF','CSV')")
    private Format fileFormat;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @CreationTimestamp
    @Column(name = "exported_at", updatable = false)
    private Instant exportedAt;
}
