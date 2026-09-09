package com.bank.admin.data;

import com.bank.admin.audit.Audited;
import com.bank.admin.common.ApiException;
import com.bank.admin.common.PagedResponse;
import com.bank.admin.security.SecurityContextUtils;
import com.bank.admin.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/** Quản lý biểu mẫu/biểu phí đính kèm file upload. */
@Service
@RequiredArgsConstructor
public class FeeTemplateService {

    private final FeeTemplateRepository feeRepo;
    private final UserRepository userRepository;
    private final FileStorageService fileStorage;

    private static final String MODULE = "DATA";

    @Transactional(readOnly = true)
    public PagedResponse<FeeTemplate> search(String title, Boolean active, int page, int size) {
        var result = feeRepo.search(title == null || title.isBlank() ? null : title.trim(), active,
            PageRequest.of(page, size));
        return new PagedResponse<>(result.getContent(), result.getNumber(), result.getSize(),
            result.getTotalElements(), result.getTotalPages());
    }

    @Transactional
    @Audited(action = "UPLOAD_FEE_TEMPLATE", module = "DATA", description = "Upload biểu phí/biểu mẫu")
    public FeeTemplate create(String title, MultipartFile file) {
        if (title == null || title.isBlank()) {
            throw ApiException.badRequest("Tiêu đề không được để trống");
        }
        var stored = fileStorage.store(file, "fees");
        return feeRepo.save(FeeTemplate.builder()
            .title(title.trim())
            .filePath(stored.urlPath())
            .fileType(resolveFileType(stored.fileName()))
            .createdBy(SecurityContextUtils.currentUserId())
            .build());
    }

    @Transactional
    @Audited(action = "UPDATE_FEE_TEMPLATE", module = "DATA", description = "Cập nhật biểu phí/biểu mẫu")
    public FeeTemplate update(Long id, DataDtos.FeeTemplateUpdateRequest req, MultipartFile newFile) {
        FeeTemplate entity = feeRepo.findById(id)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy biểu mẫu có mã " + id));
        entity.setTitle(req.title().trim());
        if (req.isActive() != null) entity.setIsActive(req.isActive());
        if (newFile != null && !newFile.isEmpty()) {
            var stored = fileStorage.store(newFile, "fees");
            entity.setFilePath(stored.urlPath());
            entity.setFileType(resolveFileType(stored.fileName()));
        }
        return feeRepo.save(entity);
    }

    @Transactional
    @Audited(action = "DELETE_FEE_TEMPLATE", module = "DATA", description = "Xóa biểu phí/biểu mẫu")
    public void delete(Long id) {
        if (!feeRepo.existsById(id)) {
            throw ApiException.notFound("Không tìm thấy biểu mẫu có mã " + id);
        }
        // Không xoá file vật lý: giữ nguyên vẹn audit trail
        feeRepo.deleteById(id);
    }

    private String resolveFileType(String fileName) {
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".pdf")) return "PDF";
        if (lower.endsWith(".xls") || lower.endsWith(".xlsx")) return "EXCEL";
        if (lower.endsWith(".csv")) return "CSV";
        return lower.substring(lower.lastIndexOf('.') + 1).toUpperCase();
    }
}
