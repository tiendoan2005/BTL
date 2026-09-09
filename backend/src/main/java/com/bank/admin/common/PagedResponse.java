package com.bank.admin.common;

import org.springframework.data.domain.Page;

import java.util.List;

/** Shape phân trang thống nhất cho FE (trả thẳng cho antd Table). */
public record PagedResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages
) {
    public static <T> PagedResponse<T> of(Page<T> page) {
        return new PagedResponse<>(page.getContent(), page.getNumber(), page.getSize(),
            page.getTotalElements(), page.getTotalPages());
    }
}
