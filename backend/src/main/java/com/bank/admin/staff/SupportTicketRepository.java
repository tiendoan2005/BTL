package com.bank.admin.staff;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {

    @Query("""
        SELECT t FROM SupportTicket t
        JOIN FETCH t.customer c
        LEFT JOIN FETCH t.assignedStaff s
        WHERE (:keyword IS NULL OR t.ticketCode LIKE CONCAT('%', :keyword, '%')
               OR t.title LIKE CONCAT('%', :keyword, '%')
               OR c.fullName LIKE CONCAT('%', :keyword, '%'))
          AND (:status IS NULL OR t.status = :status)
        ORDER BY t.id DESC
        """)
    Page<SupportTicket> search(@Param("keyword") String keyword,
                               @Param("status") SupportTicket.Status status,
                               Pageable pageable);
}
