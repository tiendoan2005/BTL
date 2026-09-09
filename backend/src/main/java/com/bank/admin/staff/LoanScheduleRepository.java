package com.bank.admin.staff;

import com.bank.admin.approval.LoanSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanScheduleRepository extends JpaRepository<LoanSchedule, Long> {
    List<LoanSchedule> findByLoanApplicationIdOrderByPeriodNumberAsc(Long loanAppId);
}
