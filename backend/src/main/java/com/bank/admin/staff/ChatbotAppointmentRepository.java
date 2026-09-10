package com.bank.admin.staff;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatbotAppointmentRepository extends JpaRepository<ChatbotAppointment, Long> {

    Optional<ChatbotAppointment> findByAppointmentCode(String appointmentCode);

    boolean existsByAppointmentCode(String appointmentCode);

    @Query("""
        SELECT a FROM ChatbotAppointment a
        WHERE (:status IS NULL OR a.status = :status)
          AND (:keyword IS NULL OR :keyword = ''
               OR LOWER(a.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR a.phoneNumber LIKE CONCAT('%', :keyword, '%')
               OR LOWER(a.appointmentCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(a.branchName) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(a.serviceType) LIKE LOWER(CONCAT('%', :keyword, '%')))
        ORDER BY a.createdAt DESC
    """)
    Page<ChatbotAppointment> search(
            @Param("keyword") String keyword,
            @Param("status") ChatbotAppointment.Status status,
            Pageable pageable
    );

    long countByStatus(ChatbotAppointment.Status status);
}
