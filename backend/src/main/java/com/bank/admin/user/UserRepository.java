package com.bank.admin.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    /** Load user kèm roles và permissions của roles trong 1 query (tránh N+1 khi build authorities). */
    @Query("""
        SELECT DISTINCT u FROM User u
        LEFT JOIN FETCH u.roles r
        LEFT JOIN FETCH r.permissions
        WHERE u.username = :username
        """)
    Optional<User> findByUsernameWithRoles(@Param("username") String username);

    /** Trang ID phục vụ tìm kiếm user (keyword khớp username/họ tên/email). */
    @Query("""
        SELECT u.id FROM User u
        WHERE (:keyword IS NULL
               OR LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')))
          AND (:status IS NULL OR u.status = :status)
        """)
    Page<Long> searchIds(@Param("keyword") String keyword,
                         @Param("status") User.Status status,
                         Pageable pageable);

    /** Nạp user kèm roles theo danh sách ID (giữ thứ tự do service xử lý). */
    @Query("""
        SELECT DISTINCT u FROM User u
        LEFT JOIN FETCH u.roles
        WHERE u.id IN :ids
        """)
    List<User> findByIdsWithRoles(@Param("ids") List<Long> ids);

    /** Nạp user kèm roles cho 1 ID (dùng để load chi tiết + update). */
    @Query("""
        SELECT DISTINCT u FROM User u
        LEFT JOIN FETCH u.roles
        WHERE u.id = :id
        """)
    Optional<User> findByIdWithRoles(@Param("id") Long id);
}
