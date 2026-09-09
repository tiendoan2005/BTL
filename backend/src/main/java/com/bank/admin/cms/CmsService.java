package com.bank.admin.cms;

import com.bank.admin.audit.Audited;
import com.bank.admin.common.ApiException;
import com.bank.admin.common.PagedResponse;
import com.bank.admin.data.FileStorageService;
import com.bank.admin.security.SecurityContextUtils;
import com.bank.admin.user.User;
import com.bank.admin.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.text.Normalizer;
import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Service quản lý bài viết + chuyên mục CMS (Module 6).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CmsService {

    private final PostRepository postRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    // ==================== BÀI VIẾT ====================

    @Transactional(readOnly = true)
    public PagedResponse<CmsDtos.PostResponse> searchPosts(
        String keyword, Post.Status status, Integer categoryId, int page, int size) {
        String kw = (keyword == null || keyword.isBlank()) ? null : keyword.trim();
        Pageable pageable = PageRequest.of(page, size);
        Page<Post> postPage = postRepository.search(kw, status, categoryId, pageable);

        // Map authorName trong 1 lượt
        Map<Long, String> authorNames = resolveAuthorNames(postPage.getContent());
        List<CmsDtos.PostResponse> content = postPage.getContent().stream()
            .map(p -> CmsDtos.PostResponse.from(p, authorNames.get(p.getAuthorId())))
            .toList();
        return new PagedResponse<>(content, postPage.getNumber(), postPage.getSize(),
            postPage.getTotalElements(), postPage.getTotalPages());
    }

    @Transactional(readOnly = true)
    public CmsDtos.PostResponse getPost(Long id) {
        Post p = postRepository.findByIdWithCategory(id)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy bài viết #" + id));
        String authorName = userRepository.findById(p.getAuthorId())
            .map(User::getFullName).orElse("Không rõ");
        return CmsDtos.PostResponse.from(p, authorName);
    }

    @Audited(action = "CREATE_POST", module = "CMS", description = "Tạo bài viết mới")
    @Transactional
    public CmsDtos.PostResponse createPost(CmsDtos.PostRequest req) {
        String slug = generateUniqueSlug(req.slug(), req.title(), null);
        Category category = resolveCategory(req.categoryId());
        Post.Status status = req.status() != null ? req.status() : Post.Status.DRAFT;
        Instant publishedAt = status == Post.Status.PUBLISHED ? Instant.now() : null;

        Post post = Post.builder()
            .title(req.title().trim())
            .slug(slug)
            .summary(emptyToNull(req.summary()))
            .content(req.content())
            .thumbnailUrl(emptyToNull(req.thumbnailUrl()))
            .category(category)
            .authorId(SecurityContextUtils.currentUserId())
            .status(status)
            .publishedAt(publishedAt)
            .build();
        postRepository.save(post);
        log.info("Đã tạo bài viết: {} (slug={})", post.getTitle(), post.getSlug());
        return CmsDtos.PostResponse.from(post, SecurityContextUtils.currentUser().getUsername());
    }

    @Audited(action = "UPDATE_POST", module = "CMS", description = "Cập nhật bài viết")
    @Transactional
    public CmsDtos.PostResponse updatePost(Long id, CmsDtos.PostRequest req) {
        Post post = postRepository.findByIdWithCategory(id)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy bài viết #" + id));

        String slug = generateUniqueSlug(req.slug(), req.title(), id);
        Category category = resolveCategory(req.categoryId());

        post.setTitle(req.title().trim());
        post.setSlug(slug);
        post.setSummary(emptyToNull(req.summary()));
        post.setContent(req.content());
        post.setThumbnailUrl(emptyToNull(req.thumbnailUrl()));
        post.setCategory(category);

        if (req.status() != null) {
            if (post.getStatus() != Post.Status.PUBLISHED && req.status() == Post.Status.PUBLISHED) {
                post.setPublishedAt(Instant.now());
            }
            post.setStatus(req.status());
        }

        postRepository.save(post);
        String authorName = userRepository.findById(post.getAuthorId())
            .map(User::getFullName).orElse("Không rõ");
        return CmsDtos.PostResponse.from(post, authorName);
    }

    @Audited(action = "DELETE_POST", module = "CMS", description = "Xóa bài viết")
    @Transactional
    public void deletePost(Long id) {
        Post post = postRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy bài viết #" + id));
        postRepository.delete(post);
        log.info("Đã xóa bài viết #{} ({})", id, post.getTitle());
    }

    @Audited(action = "UPDATE_POST_STATUS", module = "CMS", description = "Đổi trạng thái bài viết")
    @Transactional
    public CmsDtos.PostResponse changeStatus(Long id, Post.Status status) {
        Post post = postRepository.findByIdWithCategory(id)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy bài viết #" + id));
        if (post.getStatus() != Post.Status.PUBLISHED && status == Post.Status.PUBLISHED) {
            post.setPublishedAt(Instant.now());
        }
        post.setStatus(status);
        postRepository.save(post);
        String authorName = userRepository.findById(post.getAuthorId())
            .map(User::getFullName).orElse("Không rõ");
        return CmsDtos.PostResponse.from(post, authorName);
    }

    /** Upload ảnh thumbnail cho bài viết, lưu vào /uploads/cms. */
    public Map<String, String> uploadThumbnail(MultipartFile file) {
        FileStorageService.StoredFile stored = fileStorageService.store(file, "cms");
        return Map.of("url", stored.urlPath());
    }

    // ==================== CHUYÊN MỤC ====================

    @Transactional(readOnly = true)
    public List<CmsDtos.CategoryResponse> listCategories() {
        var cats = categoryRepository.findAll();
        // Đếm bài viết theo category
        return cats.stream().map(c -> new CmsDtos.CategoryResponse(
            c.getId(), c.getName(), c.getSlug(), 0L)).toList();
    }

    @Audited(action = "CREATE_CATEGORY", module = "CMS", description = "Tạo chuyên mục CMS")
    @Transactional
    public CmsDtos.CategoryResponse createCategory(CmsDtos.CategoryRequest req) {
        String slug = toSlug(req.slug() != null && !req.slug().isBlank() ? req.slug() : req.name());
        if (categoryRepository.existsBySlug(slug)) {
            throw ApiException.conflict("Chuyên mục với slug '" + slug + "' đã tồn tại");
        }
        Category cat = Category.builder().name(req.name().trim()).slug(slug).build();
        categoryRepository.save(cat);
        return new CmsDtos.CategoryResponse(cat.getId(), cat.getName(), cat.getSlug(), 0L);
    }

    @Audited(action = "DELETE_CATEGORY", module = "CMS", description = "Xóa chuyên mục CMS")
    @Transactional
    public void deleteCategory(Integer id) {
        Category cat = categoryRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy chuyên mục #" + id));
        categoryRepository.delete(cat);
    }

    // ==================== HELPER ====================

    private Category resolveCategory(Integer categoryId) {
        if (categoryId == null) return null;
        return categoryRepository.findById(categoryId)
            .orElseThrow(() -> ApiException.badRequest("Chuyên mục không tồn tại: id=" + categoryId));
    }

    private String generateUniqueSlug(String customSlug, String title, Long currentPostId) {
        String base = toSlug(customSlug != null && !customSlug.isBlank() ? customSlug : title);
        String candidate = base;
        int count = 1;
        while (currentPostId == null
            ? postRepository.existsBySlug(candidate)
            : postRepository.existsBySlugAndIdNot(candidate, currentPostId)) {
            candidate = base + "-" + (++count);
        }
        return candidate;
    }

    private String toSlug(String input) {
        if (input == null || input.isBlank()) return "bai-viet";
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String noAccents = pattern.matcher(normalized).replaceAll("")
            .replace('đ', 'd').replace('Đ', 'D');
        return noAccents.toLowerCase()
            .replaceAll("[^a-z0-9\\s-]", "")
            .replaceAll("\\s+", "-")
            .replaceAll("-+", "-")
            .replaceAll("^-|-$", "");
    }

    private String emptyToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    private Map<Long, String> resolveAuthorNames(List<Post> posts) {
        Set<Long> ids = new HashSet<>();
        for (Post p : posts) ids.add(p.getAuthorId());
        Map<Long, String> out = new HashMap<>();
        if (!ids.isEmpty()) {
            for (User u : userRepository.findAllById(ids)) {
                out.put(u.getId(), u.getFullName());
            }
        }
        return out;
    }
}
