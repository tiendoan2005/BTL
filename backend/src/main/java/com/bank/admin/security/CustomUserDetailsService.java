package com.bank.admin.security;

import com.bank.admin.approval.CustomerRepository;
import com.bank.admin.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsPasswordService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/** Bridge giữa UserRepository / CustomerRepository và Spring Security. */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements
        org.springframework.security.core.userdetails.UserDetailsService, UserDetailsPasswordService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1. Kiểm tra trong bảng users (Admin, Manager, Staff)
        var userOpt = userRepository.findByUsernameWithRoles(username);
        if (userOpt.isPresent()) {
            return new UserPrincipal(userOpt.get());
        }

        // 2. Kiểm tra trong bảng customers (Individual, Enterprise)
        var customerOpt = customerRepository.findByUsername(username);
        if (customerOpt.isPresent()) {
            return new CustomerPrincipal(customerOpt.get());
        }

        throw new UsernameNotFoundException("Không tìm thấy người dùng hoặc khách hàng: " + username);
    }

    @Override
    public UserDetails updatePassword(UserDetails user, String newPassword) {
        // Dùng khi Security tự nâng cấp encoding password (DelegatingPasswordEncoder)
        com.bank.admin.user.User entity = userRepository.findByUsernameWithRoles(user.getUsername())
            .orElseThrow(() -> new UsernameNotFoundException(user.getUsername()));
        entity.setPasswordHash(newPassword);
        return new UserPrincipal(userRepository.save(entity));
    }
}

