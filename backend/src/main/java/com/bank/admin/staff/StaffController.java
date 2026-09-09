package com.bank.admin.staff;

import com.bank.admin.approval.Customer;
import com.bank.admin.approval.CustomerRepository;
import com.bank.admin.common.ApiResponse;
import com.bank.admin.common.PagedResponse;
import com.bank.admin.staff.dto.StaffDtos.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/staff")
@RequiredArgsConstructor
public class StaffController {

    private final StaffService staffService;
    private final CustomerRepository customerRepository;

    // =========================================================================
    // 0. DANH SÁCH KHÁCH HÀNG (Dùng cho dropdown / chọn trong các form)
    // =========================================================================
    @GetMapping("/customers")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public ApiResponse<List<Customer>> listAllCustomers() {
        return ApiResponse.ok(customerRepository.findAll());
    }

    // =========================================================================
    // 1. TRA SOÁT GIAO DỊCH (DISPUTE RESOLUTION)
    // =========================================================================

    @GetMapping("/disputes")
    @PreAuthorize("hasAnyAuthority('STAFF_DISPUTE_HANDLE', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ApiResponse<PagedResponse<DisputeResponse>> getDisputes(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.ok(staffService.searchDisputes(keyword, status, page, size));
    }

    @PostMapping("/disputes")
    @PreAuthorize("hasAnyAuthority('STAFF_DISPUTE_HANDLE', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ApiResponse<DisputeResponse> createDispute(@Valid @RequestBody CreateDisputeRequest req) {
        return ApiResponse.ok("Tạo yêu cầu tra soát thành công", staffService.createDispute(req));
    }

    @PostMapping("/disputes/{id}/process")
    @PreAuthorize("hasAnyAuthority('STAFF_DISPUTE_HANDLE', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ApiResponse<DisputeResponse> processDispute(
            @PathVariable Long id,
            @Valid @RequestBody ProcessDisputeRequest req
    ) {
        return ApiResponse.ok("Xử lý tra soát thành công", staffService.processDispute(id, req));
    }

    // =========================================================================
    // 2. TƯ VẤN KHÁCH HÀNG (CRM & ADVISORY)
    // =========================================================================

    @GetMapping("/advisories")
    @PreAuthorize("hasAnyAuthority('STAFF_CUSTOMER_ADVISORY', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ApiResponse<PagedResponse<AdvisoryResponse>> getAdvisories(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.ok(staffService.searchAdvisories(keyword, status, page, size));
    }

    @PostMapping("/advisories")
    @PreAuthorize("hasAnyAuthority('STAFF_CUSTOMER_ADVISORY', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ApiResponse<AdvisoryResponse> createAdvisory(@Valid @RequestBody CreateAdvisoryRequest req) {
        return ApiResponse.ok("Ghi nhận tư vấn khách hàng thành công", staffService.createAdvisory(req));
    }

    @PutMapping("/advisories/{id}")
    @PreAuthorize("hasAnyAuthority('STAFF_CUSTOMER_ADVISORY', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ApiResponse<AdvisoryResponse> updateAdvisory(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAdvisoryRequest req
    ) {
        return ApiResponse.ok("Cập nhật tiến độ tư vấn thành công", staffService.updateAdvisory(id, req));
    }

    // =========================================================================
    // 3. HỖ TRỢ & CSKH (SUPPORT TICKETS)
    // =========================================================================

    @GetMapping("/tickets")
    @PreAuthorize("hasAnyAuthority('STAFF_SUPPORT_TICKET', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ApiResponse<PagedResponse<TicketResponse>> getTickets(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.ok(staffService.searchTickets(keyword, status, page, size));
    }

    @GetMapping("/tickets/{id}")
    @PreAuthorize("hasAnyAuthority('STAFF_SUPPORT_TICKET', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ApiResponse<TicketResponse> getTicketDetail(@PathVariable Long id) {
        return ApiResponse.ok(staffService.getTicketDetail(id));
    }

    @PostMapping("/tickets")
    @PreAuthorize("hasAnyAuthority('STAFF_SUPPORT_TICKET', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ApiResponse<TicketResponse> createTicket(@Valid @RequestBody CreateTicketRequest req) {
        return ApiResponse.ok("Tạo ticket hỗ trợ thành công", staffService.createTicket(req));
    }

    @PostMapping("/tickets/{id}/process")
    @PreAuthorize("hasAnyAuthority('STAFF_SUPPORT_TICKET', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ApiResponse<TicketResponse> processTicket(
            @PathVariable Long id,
            @Valid @RequestBody ProcessTicketRequest req
    ) {
        return ApiResponse.ok("Cập nhật tiến độ hỗ trợ CSKH thành công", staffService.processTicket(id, req));
    }

    // =========================================================================
    // 4. GIAO DỊCH TÀI CHÍNH (FINANCIAL TRANSACTIONS)
    // =========================================================================

    @GetMapping("/transactions")
    @PreAuthorize("hasAnyAuthority('STAFF_FINANCIAL_TX', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ApiResponse<PagedResponse<TransactionResponse>> getTransactions(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.ok(staffService.searchTransactions(keyword, status, page, size));
    }

    @PostMapping("/transactions")
    @PreAuthorize("hasAnyAuthority('STAFF_FINANCIAL_TX', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ApiResponse<TransactionResponse> createTransaction(@Valid @RequestBody CreateTransactionRequest req) {
        return ApiResponse.ok("Thực hiện giao dịch tài chính thành công", staffService.createTransaction(req));
    }
}
