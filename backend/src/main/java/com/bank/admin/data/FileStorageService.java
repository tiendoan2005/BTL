package com.bank.admin.data;

import com.bank.admin.common.ApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

/** Lưu file upload (biểu phí, thumbnail CMS...) vào app.upload.dir. */
@Slf4j
@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("xlsx", "xls", "csv", "pdf", "png", "jpg", "jpeg", "gif", "webp");

    @Value("${app.upload.dir}")
    private String uploadDir;

    public record StoredFile(String urlPath, String fileName, long size, String contentType) {}

    /**
     * Lưu file vào thư mục con (vd "fees", "posts").
     * Trả về đường dẫn public phục vụ qua /uploads/**.
     */
    public StoredFile store(MultipartFile file, String subDir) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("File đính kèm không được để trống");
        }
        String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        String ext = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0) ext = original.substring(dot + 1).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw ApiException.badRequest("Định dạng file không được hỗ trợ: ." + ext);
        }

        try {
            Path dir = Paths.get(uploadDir, subDir).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            String stored = LocalDate.now() + "_" + UUID.randomUUID().toString().substring(0, 8) + "." + ext;
            Path target = dir.resolve(stored);
            file.transferTo(target);

            String url = "/uploads/" + subDir + "/" + stored;
            log.info("Đã lưu file upload: {}", target);
            return new StoredFile(url, original, file.getSize(), file.getContentType());
        } catch (IOException e) {
            log.error("Lỗi lưu file upload", e);
            throw new ApiException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                "Không thể lưu file, vui lòng thử lại");
        }
    }
}
