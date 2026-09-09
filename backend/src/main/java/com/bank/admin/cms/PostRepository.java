package com.bank.admin.cms;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {

    Optional<Post> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    @Query("""
        SELECT p FROM Post p
        LEFT JOIN FETCH p.category
        WHERE (:keyword IS NULL
               OR LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(p.summary) LIKE LOWER(CONCAT('%', :keyword, '%')))
          AND (:status IS NULL OR p.status = :status)
          AND (:categoryId IS NULL OR p.category.id = :categoryId)
        ORDER BY p.id DESC
        """)
    Page<Post> search(@Param("keyword") String keyword,
                      @Param("status") Post.Status status,
                      @Param("categoryId") Integer categoryId,
                      Pageable pageable);

    @Query("SELECT p FROM Post p LEFT JOIN FETCH p.category WHERE p.id = :id")
    Optional<Post> findByIdWithCategory(@Param("id") Long id);
}
