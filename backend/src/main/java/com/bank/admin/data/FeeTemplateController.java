package com.bank.admin.data;

import com.bank.admin.common.ApiResponse;
import com.bank.admin.common.PagedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/** API quản lý biểu mẫu/biểu phí (upload file). Quyền DATA_UPDATE_RATES. */
@Tag(name = "Biểu phí & biểu mẫu")
@RestController
@RequestMapping("/api/v1/fee-templates")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('DATA_UPDATE_RATES')")
public class FeeTemplateController {

    private final FeeTemplateService service;

    @Operation(summary = "Danh sách biểu mẫu (filter title, active)")
    @GetMapping
    public ApiResponse<PagedResponse<FeeTemplate>> list(
        @RequestParam(required = false) String title,
        @RequestParam(required = false) Boolean active,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(service.search(title, active, page, size));
    }

    @Operation(summary = "Upload biểu mẫu mới (title + file)")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<FeeTemplate>> create(
        @RequestParam String title,
        @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(201)
            .body(ApiResponse.ok("Đã tải lên biểu mẫu", service.create(title, file)));
    }

    @Operation(summary = "Sửa tiêu đề/kích hoạt/thay file")
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<FeeTemplate>> update(
        @PathVariable Long id,
        @RequestParam String title,
        @RequestParam(required = false) Boolean isActive,
        @RequestParam(value = "file", required = false) MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.ok("Đã cập nhật biểu mẫu",
            service.update(id, new DataDtos.FeeTemplateUpdateRequest(title, isActive), file)));
    }

    @Operation(summary = "Xóa biểu mẫu")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.message("Đã xóa biểu mẫu");
    }
}
