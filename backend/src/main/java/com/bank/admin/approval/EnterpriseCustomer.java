package com.bank.admin.approval;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "enterprise_customers")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class EnterpriseCustomer {

    @Id
    @Column(name = "customer_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(name = "tax_code", nullable = false, unique = true, length = 50)
    private String taxCode;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "representative_name", nullable = false, length = 100)
    private String representativeName;

    @Column(name = "business_license_number", length = 100)
    private String businessLicenseNumber;

    @Column(name = "charter_capital", precision = 18, scale = 2)
    private BigDecimal charterCapital;
}
