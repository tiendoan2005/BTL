package com.bank.admin.staff.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class StaffDtos {

    private StaffDtos() {}

    // ================= 1. DISPUTE DTOS =================
    public record CreateDisputeRequest(
        @NotNull(message = "ID khách hàng không được để trống") Long customerId,
        @NotBlank(message = "Mã giao dịch không được để trống") String transactionCode,
        @NotBlank(message = "Lý do tra soát không được để trống") String reason
    ) {}

    public record ProcessDisputeRequest(
        @NotBlank(message = "Trạng thái mới không được để trống") String status, // PROCESSING, APPROVED_REFUND, REJECTED, CLOSED
        String resolutionNote
    ) {}

    @Builder
    public record DisputeResponse(
        Long id,
        String disputeCode,
        Long customerId,
        String customerName,
        String customerPhone,
        String transactionCode,
        String reason,
        String status,
        Long handlerStaffId,
        String handlerStaffName,
        String resolutionNote,
        Instant createdAt,
        Instant updatedAt
    ) {}

    // ================= 2. ADVISORY CRM DTOS =================
    public record CreateAdvisoryRequest(
        @NotNull(message = "ID khách hàng không được để trống") Long customerId,
        @NotBlank(message = "Loại sản phẩm tư vấn không được để trống") String productType,
        @NotBlank(message = "Ghi chú tư vấn không được để trống") String notes,
        String status // CONSULTED, FOLLOW_UP, COMPLETED, CANCELLED
    ) {}

    public record UpdateAdvisoryRequest(
        String notes,
        String status
    ) {}

    @Builder
    public record AdvisoryResponse(
        Long id,
        Long customerId,
        String customerName,
        String customerPhone,
        String customerEmail,
        String customerType,
        Long staffId,
        String staffName,
        String productType,
        String notes,
        String status,
        Instant createdAt,
        Instant updatedAt
    ) {}

    // ================= 3. SUPPORT TICKET DTOS =================
    public record CreateTicketRequest(
        @NotNull(message = "ID khách hàng không được để trống") Long customerId,
        @NotBlank(message = "Tiêu đề yêu cầu không được để trống") String title,
        @NotBlank(message = "Nội dung yêu cầu không được để trống") String content,
        String priority // LOW, MEDIUM, HIGH, URGENT
    ) {}

    public record ProcessTicketRequest(
        String status, // IN_PROGRESS, TRANSFERRED, RESOLVED, CLOSED
        @NotBlank(message = "Nội dung xử lý không được để trống") String actionNote
    ) {}

    @Builder
    public record TicketLogDto(
        Long id,
        String staffName,
        String actionNote,
        Instant createdAt
    ) {}

    @Builder
    public record TicketResponse(
        Long id,
        String ticketCode,
        Long customerId,
        String customerName,
        String customerPhone,
        Long assignedStaffId,
        String assignedStaffName,
        String title,
        String content,
        String priority,
        String status,
        Instant createdAt,
        Instant updatedAt,
        List<TicketLogDto> logs
    ) {}

    // ================= 4. FINANCIAL TRANSACTION DTOS =================
    public record CreateTransactionRequest(
        Long senderCustomerId,
        @NotBlank(message = "Số tài khoản thụ hưởng không được để trống") String receiverAccountNumber,
        @NotBlank(message = "Tên người thụ hưởng không được để trống") String receiverName,
        String bankName,
        @NotNull(message = "Số tiền không được để trống")
        @DecimalMin(value = "1000", message = "Số tiền tối thiểu 1,000 VND") BigDecimal amount,
        BigDecimal fee,
        String description
    ) {}

    @Builder
    public record TransactionResponse(
        Long id,
        String transactionCode,
        Long senderCustomerId,
        String senderCustomerName,
        String receiverAccountNumber,
        String receiverName,
        String bankName,
        BigDecimal amount,
        BigDecimal fee,
        String description,
        Long staffId,
        String staffName,
        String status,
        Instant createdAt
    ) {}

    // ================= 5. CHATBOT APPOINTMENT DTOS =================
    public record CreateAppointmentRequest(
        @NotBlank(message = "Họ tên không được để trống") String fullName,
        @NotBlank(message = "Số điện thoại không được để trống") String phoneNumber,
        String email,
        @NotBlank(message = "Chi nhánh không được để trống") String branchName,
        @NotBlank(message = "Dịch vụ không được để trống") String serviceType,
        @NotNull(message = "Ngày hẹn không được để trống") LocalDate appointmentDate,
        @NotBlank(message = "Khung giờ không được để trống") String timeSlot,
        String note
    ) {}

    public record UpdateAppointmentStatusRequest(
        @NotBlank(message = "Trạng thái mới không được để trống") String status, // PENDING, CONFIRMED, COMPLETED, CANCELLED
        String handlerNote
    ) {}

    @Builder
    public record AppointmentResponse(
        Long id,
        String appointmentCode,
        String fullName,
        String phoneNumber,
        String email,
        String branchName,
        String serviceType,
        LocalDate appointmentDate,
        String timeSlot,
        String note,
        String status,
        String handledBy,
        String handlerNote,
        Instant createdAt,
        Instant updatedAt
    ) {}
}
