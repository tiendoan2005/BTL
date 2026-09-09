package com.bank.admin.data;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FeeTemplateRepository extends JpaRepository<FeeTemplate, Long> {

    @Query("""
        SELECT f FROM FeeTemplate f
        WHERE (:title IS NULL OR f.title LIKE CONCAT('%', :title, '%'))
          AND (:active IS NULL OR f.isActive = :active)
        ORDER BY f.createdAt DESC
        """)
    Page<FeeTemplate> search(@Param("title") String title,
                             @Param("active") Boolean active,
                             Pageable pageable);
}
