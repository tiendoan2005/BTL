package com.bank.admin.approval;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "loan_collaterals")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class LoanCollateral {

    public enum CollateralType { CAR, REAL_ESTATE, SAVING_BOOK, OTHER }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "collateral_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_app_id", nullable = false)
    private LoanApplicationDetail loanApplication;

    @Enumerated(EnumType.STRING)
    @Column(name = "collateral_type", nullable = false, columnDefinition = "ENUM('CAR','REAL_ESTATE','SAVING_BOOK','OTHER')")
    private CollateralType collateralType;

    @Column(name = "collateral_name", nullable = false)
    private String collateralName;

    @Column(name = "estimated_value", nullable = false, precision = 18, scale = 2)
    private BigDecimal estimatedValue;

    @Column(name = "document_proof_url", length = 500)
    private String documentProofUrl;
}
