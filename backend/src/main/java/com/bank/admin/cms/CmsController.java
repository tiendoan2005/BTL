package com.bank.admin.cms;

import com.bank.admin.common.ApiResponse;
import com.bank.admin.common.PagedResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Controller Quản lý bài viết + Chuyên mục CMS (Module 6).
 */
@RestController
@RequestMapping("/api/v1/cms")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('CMS_MANAGE_POST')")
public class CmsController {

    private final CmsService cmsService;

    // ==================== BÀI VIẾT ====================

    @GetMapping("/posts")
    public ApiResponse<PagedResponse<CmsDtos.PostResponse>> searchPosts(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) Post.Status status,
        @RequestParam(required = false) Integer categoryId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(cmsService.searchPosts(keyword, status, categoryId, page, size));
    }

    @GetMapping("/posts/{id}")
    public ApiResponse<CmsDtos.PostResponse> getPost(@PathVariable Long id) {
        return ApiResponse.ok(cmsService.getPost(id));
    }

    @PostMapping("/posts")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CmsDtos.PostResponse> createPost(@Valid @RequestBody CmsDtos.PostRequest req) {
        return ApiResponse.ok("Tạo bài viết thành công", cmsService.createPost(req));
    }

    @PutMapping("/posts/{id}")
    public ApiResponse<CmsDtos.PostResponse> updatePost(
        @PathVariable Long id, @Valid @RequestBody CmsDtos.PostRequest req) {
        return ApiResponse.ok("Cập nhật bài viết thành công", cmsService.updatePost(id, req));
    }

    @DeleteMapping("/posts/{id}")
    public ApiResponse<Void> deletePost(@PathVariable Long id) {
        cmsService.deletePost(id);
        return ApiResponse.ok("Xóa bài viết thành công", null);
    }

    @PatchMapping("/posts/{id}/status")
    public ApiResponse<CmsDtos.PostResponse> changeStatus(
        @PathVariable Long id, @RequestBody Map<String, String> body) {
        String st = body.get("status");
        if (st == null || st.isBlank()) {
            throw new IllegalArgumentException("status không được để trống");
        }
        Post.Status status = Post.Status.valueOf(st.toUpperCase());
        return ApiResponse.ok("Cập nhật trạng thái thành công", cmsService.changeStatus(id, status));
    }

    @PostMapping(value = "/posts/thumbnail", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, String>> uploadThumbnail(@RequestParam("file") MultipartFile file) {
        return ApiResponse.ok("Upload thumbnail thành công", cmsService.uploadThumbnail(file));
    }

    // ==================== CHUYÊN MỤC ====================

    @GetMapping("/categories")
    public ApiResponse<List<CmsDtos.CategoryResponse>> listCategories() {
        return ApiResponse.ok(cmsService.listCategories());
    }

    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CmsDtos.CategoryResponse> createCategory(
        @Valid @RequestBody CmsDtos.CategoryRequest req) {
        return ApiResponse.ok("Tạo chuyên mục thành công", cmsService.createCategory(req));
    }

    @DeleteMapping("/categories/{id}")
    public ApiResponse<Void> deleteCategory(@PathVariable Integer id) {
        cmsService.deleteCategory(id);
        return ApiResponse.ok("Xóa chuyên mục thành công", null);
    }
}
