package com.bank.admin.customer;

import com.bank.admin.approval.Customer;
import com.bank.admin.approval.CustomerRepository;
import com.bank.admin.common.ApiException;
import com.bank.admin.common.ApiResponse;
import com.bank.admin.customer.dto.CustomerDtos.*;
import com.bank.admin.security.SecurityContextUtils;
import com.bank.admin.staff.FinancialTransaction;
import com.bank.admin.staff.FinancialTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping({"/api/v1/customer", "/api/customer"})
@RequiredArgsConstructor
public class CustomerTransactionController {

    private final FinancialTransactionRepository transactionRepo;
    private final CustomerRepository customerRepo;

    /**
     * 1. Lịch sử giao dịch: Danh sách các giao dịch gửi / nhận tiền của khách hàng
     */
    @GetMapping("/transactions")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('INDIVIDUAL') or hasRole('ENTERPRISE')")
    public ApiResponse<List<CashFlowItemDto>> getTransactions() {
        Long customerId = SecurityContextUtils.currentCustomerId();
        Customer customer = customerRepo.findById(customerId)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy khách hàng"));

        String accNum = customer.getPhoneNumber(); // Hoặc ID Card
        List<FinancialTransaction> txs = transactionRepo.findByCustomerTransactions(customerId, accNum);

        List<CashFlowItemDto> dtos = txs.stream().map(t -> {
            boolean isSender = t.getSenderCustomer() != null && t.getSenderCustomer().getId().equals(customerId);
            return CashFlowItemDto.builder()
                .id(t.getId())
                .transactionCode(t.getTransactionCode())
                .type(isSender ? "OUTFLOW" : "INFLOW")
                .amount(t.getAmount())
                .counterpartyName(isSender ? t.getReceiverName() : (t.getSenderCustomer() != null ? t.getSenderCustomer().getFullName() : "Nộp tiền mặt"))
                .bankName(t.getBankName())
                .description(t.getDescription())
                .createdAt(t.getCreatedAt())
                .build();
        }).toList();

        return ApiResponse.ok(dtos);
    }

    /**
     * 2. Quản lý dòng tiền: Thống kê dòng tiền vào/ra (Inflow/Outflow) cho Doanh nghiệp
     */
    @GetMapping("/cash-flow")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ENTERPRISE')")
    public ApiResponse<CashFlowStatisticResponse> getCashFlow() {
        Long customerId = SecurityContextUtils.currentCustomerId();
        Customer customer = customerRepo.findById(customerId)
            .orElseThrow(() -> ApiException.notFound("Không tìm thấy khách hàng"));

        String accNum = customer.getPhoneNumber();
        List<FinancialTransaction> txs = transactionRepo.findByCustomerTransactions(customerId, accNum);

        BigDecimal totalIn = BigDecimal.ZERO;
        BigDecimal totalOut = BigDecimal.ZERO;
        List<CashFlowItemDto> items = new ArrayList<>();

        for (FinancialTransaction t : txs) {
            boolean isSender = t.getSenderCustomer() != null && t.getSenderCustomer().getId().equals(customerId);
            if (isSender) {
                totalOut = totalOut.add(t.getAmount());
            } else {
                totalIn = totalIn.add(t.getAmount());
            }
            items.add(CashFlowItemDto.builder()
                .id(t.getId())
                .transactionCode(t.getTransactionCode())
                .type(isSender ? "OUTFLOW" : "INFLOW")
                .amount(t.getAmount())
                .counterpartyName(isSender ? t.getReceiverName() : (t.getSenderCustomer() != null ? t.getSenderCustomer().getFullName() : "Nộp tiền mặt"))
                .bankName(t.getBankName())
                .description(t.getDescription())
                .createdAt(t.getCreatedAt())
                .build());
        }

        BigDecimal net = totalIn.subtract(totalOut);

        return ApiResponse.ok(CashFlowStatisticResponse.builder()
            .totalInflow(totalIn)
            .totalOutflow(totalOut)
            .netCashFlow(net)
            .totalTransactions((long) txs.size())
            .recentTransactions(items)
            .build());
    }
}
