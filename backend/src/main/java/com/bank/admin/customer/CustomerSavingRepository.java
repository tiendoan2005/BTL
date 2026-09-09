package com.bank.admin.customer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerSavingRepository extends JpaRepository<CustomerSaving, Long> {
    List<CustomerSaving> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
}
