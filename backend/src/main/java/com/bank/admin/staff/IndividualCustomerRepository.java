package com.bank.admin.staff;

import com.bank.admin.approval.IndividualCustomer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IndividualCustomerRepository extends JpaRepository<IndividualCustomer, Long> {
}
