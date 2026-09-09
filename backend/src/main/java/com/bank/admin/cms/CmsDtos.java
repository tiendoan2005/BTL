package com.bank.admin.cms;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

/** DTO cho Quản trị nội dung CMS (Module 6). */
public final class CmsDtos {

    private CmsDtos() {}

    // ---------- Request ----------

    public record PostRequest(
        @NotBlank(message = "Tiêu đề bài viết không được để trống")
        @Size(max = 255)
        String title,
        @Size(max = 255)
        String slug, // nếu để trống sẽ tự sinh từ title
        String summary,
        @NotBlank(message = "Nội dung bài viết không được để trống")
        String content,
        String thumbnailUrl,
        Integer categoryId,
        Post.Status status) {}

    public record CategoryRequest(
        @NotBlank(message = "Tên chuyên mục không được để trống")
        @Size(max = 100)
        String name,
        @Size(max = 100)
        String slug) {}

    // ---------- Response ----------

    @Getter
    @Builder
    public static class PostResponse {
        private Long id;
        private String title;
        private String slug;
        private String summary;
        private String content;
        private String thumbnailUrl;
        private CategoryBrief category;
        private Long authorId;
        private String authorName;
        private Post.Status status;
        private Instant publishedAt;
        private Instant createdAt;
        private Instant updatedAt;

        @Getter
        @Builder
        public static class CategoryBrief {
            private Integer id;
            private String name;
            private String slug;
        }

        public static PostResponse from(Post p, String authorName) {
            CategoryBrief cat = null;
            if (p.getCategory() != null) {
                cat = CategoryBrief.builder()
                    .id(p.getCategory().getId())
                    .name(p.getCategory().getName())
                    .slug(p.getCategory().getSlug())
                    .build();
            }
            return PostResponse.builder()
                .id(p.getId())
                .title(p.getTitle())
                .slug(p.getSlug())
                .summary(p.getSummary())
                .content(p.getContent())
                .thumbnailUrl(p.getThumbnailUrl())
                .category(cat)
                .authorId(p.getAuthorId())
                .authorName(authorName)
                .status(p.getStatus())
                .publishedAt(p.getPublishedAt())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
        }
    }

    public record CategoryResponse(Integer id, String name, String slug, long postCount) {}
}
