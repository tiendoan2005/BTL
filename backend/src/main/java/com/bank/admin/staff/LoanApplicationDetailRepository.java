package com.bank.admin.staff;

import com.bank.admin.approval.LoanApplicationDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LoanApplicationDetailRepository extends JpaRepository<LoanApplicationDetail, Long> {
    Optional<LoanApplicationDetail> findByApplicationId(Long applicationId);
}
