package com.bank.admin.user;

import com.bank.admin.audit.Audited;
import com.bank.admin.common.ApiResponse;
import com.bank.admin.common.PagedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * API quản lý vai trò & phân quyền (Module 5 - RBAC).
 * Toàn bộ yêu cầu SYS_MANAGE_USERS.
 */
@Tag(name = "Vai trò & phân quyền")
@RestController
@RequestMapping("/api/v1/system/roles")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('SYS_MANAGE_USERS')")
public class RolesController {

    private final RoleService service;

    @Operation(summary = "Danh sách tất cả quyền (dùng cho modal phân quyền)")
    @GetMapping("/permissions")
    public ApiResponse<java.util.List<UserDtos.PermissionResponse>> listPermissions() {
        return ApiResponse.ok(service.listAllPermissions());
    }

    @Operation(summary = "Danh sách vai trò")
    @GetMapping
    public ApiResponse<PagedResponse<UserDtos.RoleResponse>> list(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(service.list(page, size));
    }

    @Operation(summary = "Chi tiết vai trò + danh sách quyền")
    @GetMapping("/{id}")
    public ApiResponse<UserDtos.RoleResponse> get(@PathVariable Integer id) {
        return ApiResponse.ok(service.get(id));
    }

    @Operation(summary = "Tạo vai trò mới (tự sinh code = ROLE_<TÊN>)")
    @PostMapping
    public ResponseEntity<ApiResponse<UserDtos.RoleResponse>> create(
        @Valid @RequestBody UserDtos.RoleRequest req) {
        var created = service.create(req);
        return ResponseEntity.status(201)
            .body(ApiResponse.ok("Đã tạo vai trò " + created.getCode(), created));
    }

    @Operation(summary = "Cập nhật vai trò")
    @PutMapping("/{id}")
    public ApiResponse<UserDtos.RoleResponse> update(
        @PathVariable Integer id, @Valid @RequestBody UserDtos.RoleRequest req) {
        return ApiResponse.ok("Đã cập nhật vai trò #" + id, service.update(id, req));
    }

    @Operation(summary = "Xóa vai trò (không cho nếu đang được gán)")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ApiResponse.message("Đã xóa vai trò #" + id);
    }

    @Operation(summary = "Gán lại toàn bộ quyền cho vai trò")
    @PutMapping("/{id}/permissions")
    public ApiResponse<UserDtos.RoleResponse> assignPermissions(
        @PathVariable Integer id, @Valid @RequestBody UserDtos.RoleRequest req) {
        return ApiResponse.ok("Đã cập nhật quyền cho vai trò #" + id,
            service.assignPermissions(id, req.permissionIds()));
    }
}