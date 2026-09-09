package com.bank.admin.staff;

import com.bank.admin.approval.EnterpriseCustomer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnterpriseCustomerRepository extends JpaRepository<EnterpriseCustomer, Long> {
}
