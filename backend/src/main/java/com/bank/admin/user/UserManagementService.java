package com.bank.admin.user;

import com.bank.admin.audit.Audited;
import com.bank.admin.common.ApiException;
import com.bank.admin.common.PagedResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Set;
import java.util.Map;

/**
 * CRUD tài khoản + gán vai trò (Module 5).
 * Quy tắc: trùng username/email -> 409; không cho tự khóa/tự hạ quyền tài khoản đang dùng.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    // ==================== TRUY VẤN ====================

    @Transactional(readOnly = true)
    public PagedResponse<UserDtos.UserResponse> search(String keyword, User.Status status, int page, int size) {
        String kw = (keyword == null || keyword.isBlank()) ? null : keyword.trim();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Long> idPage = userRepository.searchIds(kw, status, pageable);

        List<User> users = idPage.isEmpty()
            ? List.of()
            : sortByIds(userRepository.findByIdsWithRoles(idPage.getContent()), idPage.getContent());
        var content = users.stream().map(UserDtos.UserResponse::from).toList();
        return new PagedResponse<>(content, idPage.getNumber(), idPage.getSize(),
            idPage.getTotalElements(), idPage.getTotalPages());
    }

    @Transactional(readOnly = true)
    public UserDtos.UserResponse get(Long id) {
        return UserDtos.UserResponse.from(fetchUser(id));
    }

    // ==================== TẠO / SỬA / XÓA ====================

    @Audited(action = "CREATE_USER", module = "System", description = "Tạo tài khoản nhân sự")
    @Transactional
    public UserDtos.UserResponse create(UserDtos.UserCreateRequest req) {
        if (userRepository.existsByUsername(req.username().trim())) {
            throw ApiException.conflict("Tên đăng nhập '" + req.username().trim() + "' đã tồn tại");
        }
        if (userRepository.existsByEmail(req.email().trim())) {
            throw ApiException.conflict("Email '" + req.email().trim() + "' đã được sử dụng");
        }
        Set<Integer> roleIds = req.roleIds();
        User user = User.builder()
            .username(req.username().trim())
            .passwordHash(passwordEncoder.encode(req.password()))
            .email(req.email().trim())
            .fullName(req.fullName().trim())
            .phoneNumber(emptyToNull(req.phoneNumber()))
            .status(User.Status.ACTIVE)
            .build();
        applyRoles(user, roleIds);
        userRepository.save(user);
        log.info("Đã tạo tài khoản {} với {} vai trò", user.getUsername(),
            user.getRoles().size());
        return UserDtos.UserResponse.from(user);
    }

    @Audited(action = "UPDATE_USER", module = "System", description = "Cập nhật tài khoản nhân sự")
    @Transactional
    public UserDtos.UserResponse update(Long id, UserDtos.UserUpdateRequest req) {
        User user = fetchUser(id);
        boolean selfEdit = isSelf(user.getId());

        // Email trùng của user khác -> 409
        if (userRepository.existsByEmailAndIdNot(req.email().trim(), id)) {
            throw ApiException.conflict("Email '" + req.email().trim() + "' đã được sử dụng bởi tài khoản khác");
        }

        // Guard: không tự hạ chính mình (khóa/vô hiệu hóa hoặc bỏ hết vai trò)
        if (selfEdit && req.status() != null && req.status() != User.Status.ACTIVE) {
            throw ApiException.badRequest("Không thể tự thay đổi trạng thái của tài khoản đang đăng nhập");
        }

        user.setFullName(req.fullName().trim());
        user.setEmail(req.email().trim());
        user.setPhoneNumber(emptyToNull(req.phoneNumber()));
        if (req.status() != null) user.setStatus(req.status());
        if (req.newPassword() != null && !req.newPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        }
        if (req.roleIds() != null) applyRoles(user, req.roleIds());

        if (selfEdit && user.getRoles().isEmpty()) {
            throw ApiException.badRequest("Không thể tự xóa hết vai trò của tài khoản đang đăng nhập");
        }
        userRepository.save(user);
        return UserDtos.UserResponse.from(user);
    }

    @Audited(action = "DELETE_USER", module = "System", description = "Xóa tài khoản nhân sự")
    @Transactional
    public void delete(Long id) {
        if (isSelf(id)) {
            throw ApiException.badRequest("Không thể tự xóa tài khoản đang đăng nhập");
        }
        User user = fetchUser(id);
        userRepository.delete(user);
        log.info("Đã xóa tài khoản {}", user.getUsername());
    }

    /** Đổi trạng thái nhanh (khóa/mở) từ bảng danh sách. */
    @Audited(action = "UPDATE_USER_STATUS", module = "System", description = "Khóa/mở tài khoản")
    @Transactional
    public UserDtos.UserResponse changeStatus(Long id, User.Status status) {
        if (isSelf(id) && status != User.Status.ACTIVE) {
            throw ApiException.badRequest("Không thể tự thay đổi trạng thái của tài khoản đang đăng nhập");
        }
        User user = fetchUser(id);
        user.setStatus(status);
        return UserDtos.UserResponse.from(userRepository.save(user));
    }

    // ==================== PRIVATE ====================

    private void applyRoles(User user, Set<Integer> roleIds) {
        if (roleIds == null) return; // null = giữ nguyên; rỗng = xóa hết (chỉ hợp lệ với user khác)
        var roles = new java.util.LinkedHashSet<Role>();
        for (Integer roleId : roleIds) {
            Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> ApiException.badRequest("Vai trò không tồn tại: id=" + roleId));
            roles.add(role);
        }
        user.getRoles().clear();
        user.getRoles().addAll(roles);
    }

    private User fetchUser(Long id) {
        return userRepository.findByIdWithRoles(id)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy tài khoản #" + id));
    }

    private boolean isSelf(Long id) {
        return com.bank.admin.security.SecurityContextUtils.currentUserId().equals(id);
    }

    private String emptyToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    private List<User> sortByIds(List<User> users, List<Long> orderedIds) {
        Map<Long, User> byId = new HashMap<>();
        for (User u : users) byId.put(u.getId(), u);
        List<User> out = new ArrayList<>();
        for (Long id : orderedIds) {
            User u = byId.get(id);
            if (u != null) out.add(u);
        }
        return out;
    }
}
