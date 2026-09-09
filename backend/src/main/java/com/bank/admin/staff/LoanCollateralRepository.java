package com.bank.admin.staff;

import com.bank.admin.approval.LoanCollateral;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanCollateralRepository extends JpaRepository<LoanCollateral, Long> {
    List<LoanCollateral> findByLoanApplicationId(Long loanAppId);
}
