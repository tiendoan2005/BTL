package com.bank.admin.customer;

import com.bank.admin.common.ApiResponse;
import com.bank.admin.customer.dto.CustomerDtos.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/customer", "/api/customer"})
@RequiredArgsConstructor
public class CustomerAuthController {

    private final CustomerAuthService authService;

    @PostMapping({"/auth/login", "/login"})
    public ApiResponse<CustomerLoginResponse> login(@Valid @RequestBody CustomerLoginRequest req) {
        return ApiResponse.ok("Đăng nhập thành công", authService.login(req));
    }

    @PostMapping({"/auth/register", "/register"})
    public ApiResponse<CustomerLoginResponse> register(@Valid @RequestBody CustomerRegisterRequest req) {
        return ApiResponse.ok("Đăng ký tài khoản khách hàng thành công", authService.register(req));
    }

    @GetMapping("/profile")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('INDIVIDUAL') or hasRole('ENTERPRISE')")
    public ApiResponse<CustomerProfileResponse> getProfile() {
        return ApiResponse.ok(authService.getProfile());
    }
}
