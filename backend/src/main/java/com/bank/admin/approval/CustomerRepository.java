package com.bank.admin.approval;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByIdCardNumber(String idCardNumber);
    Optional<Customer> findByPhoneNumber(String phoneNumber);
    Optional<Customer> findByUsername(String username);
}
