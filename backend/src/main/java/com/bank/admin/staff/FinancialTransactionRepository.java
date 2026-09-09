package com.bank.admin.staff;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FinancialTransactionRepository extends JpaRepository<FinancialTransaction, Long> {

    @Query("""
        SELECT t FROM FinancialTransaction t
        LEFT JOIN FETCH t.senderCustomer c
        JOIN FETCH t.processedByStaff s
        WHERE (:keyword IS NULL OR t.transactionCode LIKE CONCAT('%', :keyword, '%')
               OR t.receiverAccountNumber LIKE CONCAT('%', :keyword, '%')
               OR t.receiverName LIKE CONCAT('%', :keyword, '%')
               OR (c IS NOT NULL AND c.fullName LIKE CONCAT('%', :keyword, '%')))
          AND (:status IS NULL OR t.status = :status)
        ORDER BY t.id DESC
        """)
    Page<FinancialTransaction> search(@Param("keyword") String keyword,
                                      @Param("status") FinancialTransaction.Status status,
                                      Pageable pageable);

    @Query("""
        SELECT t FROM FinancialTransaction t
        LEFT JOIN FETCH t.senderCustomer c
        WHERE c.id = :customerId OR t.receiverAccountNumber = :accountNumber
        ORDER BY t.createdAt DESC
        """)
    java.util.List<FinancialTransaction> findByCustomerTransactions(@Param("customerId") Long customerId,
                                                                   @Param("accountNumber") String accountNumber);
}
