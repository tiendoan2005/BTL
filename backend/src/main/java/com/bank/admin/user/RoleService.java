package com.bank.admin.user;

import com.bank.admin.audit.Audited;
import com.bank.admin.common.ApiException;
import com.bank.admin.common.PagedResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * CRUD vai trò + gán quyền (Module 5).
 * Role.code là authority của Spring Security -> updatable=false (không đổi tên vai trò sau khi tạo).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    @Transactional(readOnly = true)
    public List<UserDtos.PermissionResponse> listAllPermissions() {
        return permissionRepository.findAll(Sort.by(Sort.Direction.ASC, "id")).stream()
            .map(p -> new UserDtos.PermissionResponse(p.getId(), p.getCode(), p.getName(), p.getModuleName()))
            .toList();
    }

    @Transactional(readOnly = true)
    public PagedResponse<UserDtos.RoleResponse> list(int page, int size) {
        var result = roleRepository.findAll(PageRequest.of(page, size,
            Sort.by(Sort.Direction.ASC, "id")));
        var counts = countUsersPerRole();
        var content = result.map(r -> toResponse(r, counts));
        return PagedResponse.of(content);
    }

    @Transactional(readOnly = true)
    public UserDtos.RoleResponse get(Integer id) {
        return toResponse(roleRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy vai trò #" + id)),
            countUsersPerRole());
    }

    @Audited(action = "CREATE_ROLE", module = "System", description = "Tạo vai trò mới")
    @Transactional
    public UserDtos.RoleResponse create(UserDtos.RoleRequest req) {
        String code = "ROLE_" + req.name().trim().toUpperCase()
            .replaceAll("[^A-Z0-9_]", "_");
        if (roleRepository.existsByCode(code)) {
            throw ApiException.conflict("Vai trò '" + code + "' đã tồn tại");
        }
        Role role = Role.builder().code(code).name(req.name().trim())
            .description(req.description()).build();
        applyPermissions(role, req.permissionIds());
        roleRepository.save(role);
        log.info("Đã tạo vai trò {} với {} quyền", role.getCode(), role.getPermissions().size());
        return toResponse(role, Map.of());
    }

    @Audited(action = "UPDATE_ROLE", module = "System", description = "Cập nhật vai trò")
    @Transactional
    public UserDtos.RoleResponse update(Integer id, UserDtos.RoleRequest req) {
        Role role = roleRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy vai trò #" + id));
        role.setName(req.name().trim());
        role.setDescription(req.description());
        if (req.permissionIds() != null) applyPermissions(role, req.permissionIds());
        return toResponse(role, countUsersPerRole());
    }

    @Audited(action = "DELETE_ROLE", module = "System", description = "Xóa vai trò")
    @Transactional
    public void delete(Integer id) {
        var counts = countUsersPerRole();
        Long inUse = counts.get(id);
        if (inUse != null && inUse > 0) {
            throw ApiException.badRequest("Không thể xóa vai trò đang được gán cho " + inUse + " tài khoản");
        }
        Role role = roleRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy vai trò #" + id));
        roleRepository.delete(role);
        log.info("Đã xóa vai trò {}", role.getCode());
    }

    /** Gán lại toàn bộ quyền cho vai trò (null = giữ nguyên). */
    @Transactional
    public UserDtos.RoleResponse assignPermissions(Integer id, Set<Integer> permissionIds) {
        Role role = roleRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy vai trò #" + id));
        applyPermissions(role, permissionIds);
        return toResponse(role, countUsersPerRole());
    }

    // ==================== PRIVATE ====================

    private void applyPermissions(Role role, Set<Integer> ids) {
        if (ids == null) return;
        var perms = new java.util.LinkedHashSet<Permission>();
        for (Integer pid : ids) {
            Permission p = permissionRepository.findById(pid)
                .orElseThrow(() -> ApiException.badRequest("Quyền không tồn tại: id=" + pid));
            perms.add(p);
        }
        role.getPermissions().clear();
        role.getPermissions().addAll(perms);
    }

    private Map<Integer, Long> countUsersPerRole() {
        var out = new HashMap<Integer, Long>();
        for (var row : roleRepository.countUsersPerRole()) {
            out.put(row.getRoleId(), row.getUserCount());
        }
        return out;
    }

    private UserDtos.RoleResponse toResponse(Role role, Map<Integer, Long> counts) {
        var perms = role.getPermissions().stream()
            .map(p -> UserDtos.RoleResponse.PermissionBrief.builder()
                .id(p.getId()).code(p.getCode()).build())
            .toList();
        return UserDtos.RoleResponse.builder()
            .id(role.getId())
            .code(role.getCode())
            .name(role.getName())
            .description(role.getDescription())
            .permissions(perms)
            .userCount(counts.getOrDefault(role.getId(), 0L))
            .build();
    }
}