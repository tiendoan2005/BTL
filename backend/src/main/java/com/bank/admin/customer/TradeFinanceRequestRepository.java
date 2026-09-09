package com.bank.admin.customer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TradeFinanceRequestRepository extends JpaRepository<TradeFinanceRequest, Long> {
    List<TradeFinanceRequest> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
}
