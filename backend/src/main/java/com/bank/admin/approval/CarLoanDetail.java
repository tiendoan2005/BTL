package com.bank.admin.approval;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "car_loan_details")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class CarLoanDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "car_detail_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_app_id", nullable = false, unique = true)
    private LoanApplicationDetail loanApplication;

    @Column(name = "car_brand", nullable = false, length = 100)
    private String carBrand;

    @Column(name = "car_model", nullable = false, length = 100)
    private String carModel;

    @Column(name = "manufacture_year", nullable = false)
    private Integer manufactureYear;

    @Column(name = "car_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal carPrice;

    @Column(name = "is_new_car")
    @Builder.Default
    private Boolean isNewCar = true;
}
