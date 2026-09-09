package com.bank.admin.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Integer> {

    Optional<Role> findByCode(String code);

    boolean existsByCode(String code);

    /** Đếm số user đang mang mỗi vai trò (để chặn xóa vai trò đang được gán). */
    @Query("SELECT r.id AS roleId, COUNT(u) AS userCount FROM Role r LEFT JOIN r.users u GROUP BY r.id")
    List<RoleUserCount> countUsersPerRole();

    /** Projection kết quả đếm user theo vai trò. */
    interface RoleUserCount {
        Integer getRoleId();

        Long getUserCount();
    }
}
