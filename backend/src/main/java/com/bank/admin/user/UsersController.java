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
 * API quản lý tài khoản nhân sự (Module 5 - RBAC).
 * Quyền SYS_MANAGE_USERS (trừ GET /system/users - xem được bất kỳ ai đã login,
 * nhưng menu ẩn nếu không có quyền; ở đây chỉ yêu cầu login).
 */
@Tag(name = "Tài khoản & phân quyền")
@RestController
@RequestMapping("/api/v1/system/users")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('SYS_MANAGE_USERS')")
public class UsersController {

    private final UserManagementService service;

    @Operation(summary = "Danh sách tài khoản (tìm kiếm theo keyword + trạng thái)")
    @GetMapping
    public ApiResponse<PagedResponse<UserDtos.UserResponse>> list(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) User.Status status,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(service.search(keyword, status, page, size));
    }

    @Operation(summary = "Chi tiết tài khoản")
    @GetMapping("/{id}")
    public ApiResponse<UserDtos.UserResponse> get(@PathVariable Long id) {
        return ApiResponse.ok(service.get(id));
    }

    @Operation(summary = "Tạo tài khoản mới")
    @PostMapping
    public ResponseEntity<ApiResponse<UserDtos.UserResponse>> create(
        @Valid @RequestBody UserDtos.UserCreateRequest req) {
        var created = service.create(req);
        return ResponseEntity.status(201).body(ApiResponse.ok("Đã tạo tài khoản " + created.getUsername(), created));
    }

    @Operation(summary = "Cập nhật tài khoản")
    @PutMapping("/{id}")
    public ApiResponse<UserDtos.UserResponse> update(
        @PathVariable Long id, @Valid @RequestBody UserDtos.UserUpdateRequest req) {
        return ApiResponse.ok("Đã cập nhật tài khoản #" + id, service.update(id, req));
    }

    @Operation(summary = "Xóa tài khoản")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.message("Đã xóa tài khoản #" + id);
    }

    @Operation(summary = "Khóa/mở tài khoản")
    @PatchMapping("/{id}/status")
    public ApiResponse<UserDtos.UserResponse> changeStatus(
        @PathVariable Long id, @RequestParam User.Status status) {
        return ApiResponse.ok(service.changeStatus(id, status));
    }
}