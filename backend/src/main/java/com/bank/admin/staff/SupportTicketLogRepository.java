package com.bank.admin.staff;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SupportTicketLogRepository extends JpaRepository<SupportTicketLog, Long> {

    @Query("""
        SELECT l FROM SupportTicketLog l
        JOIN FETCH l.staff s
        WHERE l.ticket.id = :ticketId
        ORDER BY l.id ASC
        """)
    List<SupportTicketLog> findByTicketIdWithStaff(@Param("ticketId") Long ticketId);
}
