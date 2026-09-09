package com.bank.admin.staff;

import com.bank.admin.approval.CarLoanDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CarLoanDetailRepository extends JpaRepository<CarLoanDetail, Long> {
    Optional<CarLoanDetail> findByLoanApplicationId(Long loanAppId);
}
