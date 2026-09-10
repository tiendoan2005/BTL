package com.bank.admin.staff;

import com.bank.admin.approval.Customer;
import com.bank.admin.approval.CustomerRepository;
import com.bank.admin.audit.Audited;
import com.bank.admin.common.ApiException;
import com.bank.admin.common.PagedResponse;
import com.bank.admin.security.SecurityContextUtils;
import com.bank.admin.staff.dto.StaffDtos.*;
import com.bank.admin.user.User;
import com.bank.admin.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class StaffService {

    private final DisputeRequestRepository disputeRepo;
    private final CustomerAdvisoryRepository advisoryRepo;
    private final SupportTicketRepository ticketRepo;
    private final SupportTicketLogRepository ticketLogRepo;
    private final FinancialTransactionRepository transactionRepo;
    private final CustomerRepository customerRepo;
    private final UserRepository userRepo;
    private final ChatbotAppointmentRepository appointmentRepo;

    // =========================================================================
    // 1. TRA SOÁT (DISPUTE)
    // =========================================================================

    @Transactional(readOnly = true)
    public PagedResponse<DisputeResponse> searchDisputes(String keyword, String status, int page, int size) {
        DisputeRequest.Status st = null;
        if (status != null && !status.isBlank()) {
            try { st = DisputeRequest.Status.valueOf(status.toUpperCase()); } catch (Exception ignored) {}
        }
        Page<DisputeRequest> res = disputeRepo.search(keyword, st, PageRequest.of(page, size));
        return new PagedResponse<>(res.map(this::toDisputeDto).getContent(),
            res.getNumber(), res.getSize(), res.getTotalElements(), res.getTotalPages());
    }

    @Transactional
    @Audited(action = "CREATE_DISPUTE", module = "StaffModule", description = "Tạo mới yêu cầu tra soát giao dịch")
    public DisputeResponse createDispute(CreateDisputeRequest req) {
        Customer customer = customerRepo.findById(req.customerId())
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy khách hàng #" + req.customerId()));

        String code = "TS-" + LocalDate.now().getYear() + "-" + String.format("%04d", (int)(Math.random() * 9000) + 1000);

        DisputeRequest dispute = DisputeRequest.builder()
            .disputeCode(code)
            .customer(customer)
            .transactionCode(req.transactionCode().trim())
            .reason(req.reason().trim())
            .status(DisputeRequest.Status.PENDING)
            .build();

        return toDisputeDto(disputeRepo.save(dispute));
    }

    @Transactional
    @Audited(action = "PROCESS_DISPUTE", module = "StaffModule", description = "Xử lý kết quả yêu cầu tra soát")
    public DisputeResponse processDispute(Long id, ProcessDisputeRequest req) {
        DisputeRequest dispute = disputeRepo.findById(id)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy yêu cầu tra soát #" + id));

        DisputeRequest.Status newStatus;
        try {
            newStatus = DisputeRequest.Status.valueOf(req.status().toUpperCase());
        } catch (Exception e) {
            throw ApiException.badRequest("Trạng thái tra soát không hợp lệ: " + req.status());
        }

        User staff = userRepo.getReferenceById(SecurityContextUtils.currentUserId());
        dispute.setStatus(newStatus);
        dispute.setHandlerStaff(staff);
        if (req.resolutionNote() != null) {
            dispute.setResolutionNote(req.resolutionNote().trim());
        }

        return toDisputeDto(disputeRepo.save(dispute));
    }

    // =========================================================================
    // 2. TƯ VẤN KHÁCH HÀNG (CRM ADVISORY)
    // =========================================================================

    @Transactional(readOnly = true)
    public PagedResponse<AdvisoryResponse> searchAdvisories(String keyword, String status, int page, int size) {
        CustomerAdvisory.Status st = null;
        if (status != null && !status.isBlank()) {
            try { st = CustomerAdvisory.Status.valueOf(status.toUpperCase()); } catch (Exception ignored) {}
        }
        Page<CustomerAdvisory> res = advisoryRepo.search(keyword, st, PageRequest.of(page, size));
        return new PagedResponse<>(res.map(this::toAdvisoryDto).getContent(),
            res.getNumber(), res.getSize(), res.getTotalElements(), res.getTotalPages());
    }

    @Transactional
    @Audited(action = "CREATE_ADVISORY", module = "StaffModule", description = "Ghi nhận tư vấn khách hàng")
    public AdvisoryResponse createAdvisory(CreateAdvisoryRequest req) {
        Customer customer = customerRepo.findById(req.customerId())
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy khách hàng #" + req.customerId()));

        User staff = userRepo.getReferenceById(SecurityContextUtils.currentUserId());

        CustomerAdvisory.Status st = CustomerAdvisory.Status.CONSULTED;
        if (req.status() != null && !req.status().isBlank()) {
            try { st = CustomerAdvisory.Status.valueOf(req.status().toUpperCase()); } catch (Exception ignored) {}
        }

        CustomerAdvisory advisory = CustomerAdvisory.builder()
            .customer(customer)
            .staff(staff)
            .productType(req.productType().trim())
            .notes(req.notes().trim())
            .status(st)
            .build();

        return toAdvisoryDto(advisoryRepo.save(advisory));
    }

    @Transactional
    @Audited(action = "UPDATE_ADVISORY", module = "StaffModule", description = "Cập nhật tiến độ tư vấn khách hàng")
    public AdvisoryResponse updateAdvisory(Long id, UpdateAdvisoryRequest req) {
        CustomerAdvisory advisory = advisoryRepo.findById(id)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy bản ghi tư vấn #" + id));

        if (req.notes() != null && !req.notes().isBlank()) {
            advisory.setNotes(req.notes().trim());
        }
        if (req.status() != null && !req.status().isBlank()) {
            try { advisory.setStatus(CustomerAdvisory.Status.valueOf(req.status().toUpperCase())); } catch (Exception ignored) {}
        }

        return toAdvisoryDto(advisoryRepo.save(advisory));
    }

    // =========================================================================
    // 3. HỖ TRỢ & CSKH (TICKETS)
    // =========================================================================

    @Transactional(readOnly = true)
    public PagedResponse<TicketResponse> searchTickets(String keyword, String status, int page, int size) {
        SupportTicket.Status st = null;
        if (status != null && !status.isBlank()) {
            try { st = SupportTicket.Status.valueOf(status.toUpperCase()); } catch (Exception ignored) {}
        }
        Page<SupportTicket> res = ticketRepo.search(keyword, st, PageRequest.of(page, size));
        return new PagedResponse<>(res.map(this::toTicketDto).getContent(),
            res.getNumber(), res.getSize(), res.getTotalElements(), res.getTotalPages());
    }

    @Transactional(readOnly = true)
    public TicketResponse getTicketDetail(Long id) {
        SupportTicket ticket = ticketRepo.findById(id)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy ticket #" + id));
        return toTicketDto(ticket);
    }

    @Transactional
    @Audited(action = "CREATE_TICKET", module = "StaffModule", description = "Mở yêu cầu hỗ trợ khách hàng mới")
    public TicketResponse createTicket(CreateTicketRequest req) {
        Customer customer = customerRepo.findById(req.customerId())
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy khách hàng #" + req.customerId()));

        String code = "TK-" + LocalDate.now().getYear() + "-" + String.format("%04d", (int)(Math.random() * 9000) + 1000);

        SupportTicket.Priority priority = SupportTicket.Priority.MEDIUM;
        if (req.priority() != null && !req.priority().isBlank()) {
            try { priority = SupportTicket.Priority.valueOf(req.priority().toUpperCase()); } catch (Exception ignored) {}
        }

        User staff = userRepo.getReferenceById(SecurityContextUtils.currentUserId());

        SupportTicket ticket = SupportTicket.builder()
            .ticketCode(code)
            .customer(customer)
            .assignedStaff(staff)
            .title(req.title().trim())
            .content(req.content().trim())
            .priority(priority)
            .status(SupportTicket.Status.NEW)
            .build();

        return toTicketDto(ticketRepo.save(ticket));
    }

    @Transactional
    @Audited(action = "PROCESS_TICKET", module = "StaffModule", description = "Xử lý / phản hồi yêu cầu CSKH")
    public TicketResponse processTicket(Long id, ProcessTicketRequest req) {
        SupportTicket ticket = ticketRepo.findById(id)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy ticket #" + id));

        User staff = userRepo.getReferenceById(SecurityContextUtils.currentUserId());

        if (req.status() != null && !req.status().isBlank()) {
            try { ticket.setStatus(SupportTicket.Status.valueOf(req.status().toUpperCase())); } catch (Exception ignored) {}
        }
        ticket.setAssignedStaff(staff);
        ticketRepo.save(ticket);

        // Lưu log tiến trình xử lý
        SupportTicketLog logRecord = SupportTicketLog.builder()
            .ticket(ticket)
            .staff(staff)
            .actionNote(req.actionNote().trim())
            .build();
        ticketLogRepo.save(logRecord);

        return toTicketDto(ticket);
    }

    // =========================================================================
    // 4. GIAO DỊCH TÀI CHÍNH (FINANCIAL TRANSACTIONS)
    // =========================================================================

    @Transactional(readOnly = true)
    public PagedResponse<TransactionResponse> searchTransactions(String keyword, String status, int page, int size) {
        FinancialTransaction.Status st = null;
        if (status != null && !status.isBlank()) {
            try { st = FinancialTransaction.Status.valueOf(status.toUpperCase()); } catch (Exception ignored) {}
        }
        Page<FinancialTransaction> res = transactionRepo.search(keyword, st, PageRequest.of(page, size));
        return new PagedResponse<>(res.map(this::toTransactionDto).getContent(),
            res.getNumber(), res.getSize(), res.getTotalElements(), res.getTotalPages());
    }

    @Transactional
    @Audited(action = "CREATE_FINANCIAL_TX", module = "StaffModule", description = "Thực hiện giao dịch chuyển/nạp tiền")
    public TransactionResponse createTransaction(CreateTransactionRequest req) {
        Customer sender = null;
        if (req.senderCustomerId() != null) {
            sender = customerRepo.findById(req.senderCustomerId()).orElse(null);
        }

        User staff = userRepo.getReferenceById(SecurityContextUtils.currentUserId());
        String code = "TXN-" + LocalDate.now().getYear() + "-" + String.format("%06d", (int)(Math.random() * 900000) + 100000);

        FinancialTransaction tx = FinancialTransaction.builder()
            .transactionCode(code)
            .senderCustomer(sender)
            .receiverAccountNumber(req.receiverAccountNumber().trim())
            .receiverName(req.receiverName().trim())
            .bankName(req.bankName() != null && !req.bankName().isBlank() ? req.bankName().trim() : "VIETCOMBANK")
            .amount(req.amount())
            .fee(req.fee() != null ? req.fee() : BigDecimal.ZERO)
            .description(req.description() != null ? req.description().trim() : "Chuyển tiền qua quầy")
            .processedByStaff(staff)
            .status(FinancialTransaction.Status.SUCCESS)
            .build();

        return toTransactionDto(transactionRepo.save(tx));
    }

    // =========================================================================
    // MAPPERS
    // =========================================================================

    private DisputeResponse toDisputeDto(DisputeRequest d) {
        return DisputeResponse.builder()
            .id(d.getId())
            .disputeCode(d.getDisputeCode())
            .customerId(d.getCustomer().getId())
            .customerName(d.getCustomer().getFullName())
            .customerPhone(d.getCustomer().getPhoneNumber())
            .transactionCode(d.getTransactionCode())
            .reason(d.getReason())
            .status(d.getStatus().name())
            .handlerStaffId(d.getHandlerStaff() != null ? d.getHandlerStaff().getId() : null)
            .handlerStaffName(d.getHandlerStaff() != null ? d.getHandlerStaff().getFullName() : null)
            .resolutionNote(d.getResolutionNote())
            .createdAt(d.getCreatedAt())
            .updatedAt(d.getUpdatedAt())
            .build();
    }

    private AdvisoryResponse toAdvisoryDto(CustomerAdvisory a) {
        return AdvisoryResponse.builder()
            .id(a.getId())
            .customerId(a.getCustomer().getId())
            .customerName(a.getCustomer().getFullName())
            .customerPhone(a.getCustomer().getPhoneNumber())
            .customerEmail(a.getCustomer().getEmail())
            .customerType(a.getCustomer().getCustomerType().name())
            .staffId(a.getStaff().getId())
            .staffName(a.getStaff().getFullName())
            .productType(a.getProductType())
            .notes(a.getNotes())
            .status(a.getStatus().name())
            .createdAt(a.getCreatedAt())
            .updatedAt(a.getUpdatedAt())
            .build();
    }

    private TicketResponse toTicketDto(SupportTicket t) {
        List<TicketLogDto> logs = ticketLogRepo.findByTicketIdWithStaff(t.getId()).stream()
            .map(l -> TicketLogDto.builder()
                .id(l.getId())
                .staffName(l.getStaff().getFullName())
                .actionNote(l.getActionNote())
                .createdAt(l.getCreatedAt())
                .build())
            .toList();

        return TicketResponse.builder()
            .id(t.getId())
            .ticketCode(t.getTicketCode())
            .customerId(t.getCustomer().getId())
            .customerName(t.getCustomer().getFullName())
            .customerPhone(t.getCustomer().getPhoneNumber())
            .assignedStaffId(t.getAssignedStaff() != null ? t.getAssignedStaff().getId() : null)
            .assignedStaffName(t.getAssignedStaff() != null ? t.getAssignedStaff().getFullName() : null)
            .title(t.getTitle())
            .content(t.getContent())
            .priority(t.getPriority().name())
            .status(t.getStatus().name())
            .createdAt(t.getCreatedAt())
            .updatedAt(t.getUpdatedAt())
            .logs(logs)
            .build();
    }

    private TransactionResponse toTransactionDto(FinancialTransaction tx) {
        return TransactionResponse.builder()
            .id(tx.getId())
            .transactionCode(tx.getTransactionCode())
            .senderCustomerId(tx.getSenderCustomer() != null ? tx.getSenderCustomer().getId() : null)
            .senderCustomerName(tx.getSenderCustomer() != null ? tx.getSenderCustomer().getFullName() : "Nộp tiền mặt tại quầy")
            .receiverAccountNumber(tx.getReceiverAccountNumber())
            .receiverName(tx.getReceiverName())
            .bankName(tx.getBankName())
            .amount(tx.getAmount())
            .fee(tx.getFee())
            .description(tx.getDescription())
            .staffId(tx.getProcessedByStaff().getId())
            .staffName(tx.getProcessedByStaff().getFullName())
            .status(tx.getStatus().name())
            .createdAt(tx.getCreatedAt())
            .build();
    }

    // =========================================================================
    // 5. QUẢN LÝ LỊCH HẸN CHATBOT (APPOINTMENT MANAGEMENT)
    // =========================================================================

    @Transactional
    public AppointmentResponse createAppointment(CreateAppointmentRequest req) {
        String code = "VCB-APT-" + LocalDate.now().getYear() + "-" + String.format("%05d", (int)(Math.random() * 90000) + 10000);
        while (appointmentRepo.existsByAppointmentCode(code)) {
            code = "VCB-APT-" + LocalDate.now().getYear() + "-" + String.format("%05d", (int)(Math.random() * 90000) + 10000);
        }

        ChatbotAppointment apt = ChatbotAppointment.builder()
            .appointmentCode(code)
            .fullName(req.fullName().trim())
            .phoneNumber(req.phoneNumber().trim())
            .email(req.email() != null ? req.email().trim() : null)
            .branchName(req.branchName().trim())
            .serviceType(req.serviceType().trim())
            .appointmentDate(req.appointmentDate())
            .timeSlot(req.timeSlot().trim())
            .note(req.note())
            .status(ChatbotAppointment.Status.PENDING)
            .build();

        ChatbotAppointment saved = appointmentRepo.save(apt);
        return toAppointmentDto(saved);
    }

    @Transactional(readOnly = true)
    public PagedResponse<AppointmentResponse> searchAppointments(String keyword, String status, int page, int size) {
        ChatbotAppointment.Status st = null;
        if (status != null && !status.isBlank()) {
            try { st = ChatbotAppointment.Status.valueOf(status.toUpperCase()); } catch (Exception ignored) {}
        }
        Page<ChatbotAppointment> res = appointmentRepo.search(keyword, st, PageRequest.of(page, size));
        return new PagedResponse<>(res.map(this::toAppointmentDto).getContent(),
            res.getNumber(), res.getSize(), res.getTotalElements(), res.getTotalPages());
    }

    @Transactional
    @Audited(action = "UPDATE_APPOINTMENT_STATUS", module = "StaffModule", description = "Cập nhật trạng thái lịch hẹn Chatbot")
    public AppointmentResponse updateAppointmentStatus(Long id, UpdateAppointmentStatusRequest req, String currentStaffName) {
        ChatbotAppointment apt = appointmentRepo.findById(id)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy lịch hẹn #" + id));

        try {
            apt.setStatus(ChatbotAppointment.Status.valueOf(req.status().toUpperCase()));
        } catch (Exception e) {
            throw ApiException.badRequest("Trạng thái không hợp lệ: " + req.status());
        }

        if (req.handlerNote() != null && !req.handlerNote().isBlank()) {
            apt.setHandlerNote(req.handlerNote().trim());
        }
        if (currentStaffName != null && !currentStaffName.isBlank()) {
            apt.setHandledBy(currentStaffName);
        }

        ChatbotAppointment updated = appointmentRepo.save(apt);
        return toAppointmentDto(updated);
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Long> getAppointmentStats() {
        return java.util.Map.of(
            "total", appointmentRepo.count(),
            "pending", appointmentRepo.countByStatus(ChatbotAppointment.Status.PENDING),
            "confirmed", appointmentRepo.countByStatus(ChatbotAppointment.Status.CONFIRMED),
            "completed", appointmentRepo.countByStatus(ChatbotAppointment.Status.COMPLETED),
            "cancelled", appointmentRepo.countByStatus(ChatbotAppointment.Status.CANCELLED)
        );
    }

    private AppointmentResponse toAppointmentDto(ChatbotAppointment a) {
        return AppointmentResponse.builder()
            .id(a.getId())
            .appointmentCode(a.getAppointmentCode())
            .fullName(a.getFullName())
            .phoneNumber(a.getPhoneNumber())
            .email(a.getEmail())
            .branchName(a.getBranchName())
            .serviceType(a.getServiceType())
            .appointmentDate(a.getAppointmentDate())
            .timeSlot(a.getTimeSlot())
            .note(a.getNote())
            .status(a.getStatus().name())
            .handledBy(a.getHandledBy())
            .handlerNote(a.getHandlerNote())
            .createdAt(a.getCreatedAt())
            .updatedAt(a.getUpdatedAt())
            .build();
    }
}
