package com.bank.admin.security;

import com.bank.admin.approval.Customer;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.List;

/**
 * Principal đại diện cho Khách hàng đăng nhập Cổng Customer Portal (ROLE_CUSTOMER).
 */
@Getter
public class CustomerPrincipal implements UserDetails {

    private final Long customerId;
    private final String username;
    private final String fullName;
    private final String passwordHash;
    private final Customer.CustomerType customerType;
    private final boolean active;
    private final Collection<? extends GrantedAuthority> authorities;

    public CustomerPrincipal(Customer customer) {
        this.customerId = customer.getId();
        this.username = customer.getUsername() != null ? customer.getUsername() : customer.getIdCardNumber();
        this.fullName = customer.getFullName();
        this.passwordHash = customer.getPasswordHash();
        this.customerType = customer.getCustomerType();
        this.active = customer.getStatus() == Customer.Status.ACTIVE;
        this.authorities = List.of(
            new SimpleGrantedAuthority("ROLE_CUSTOMER"),
            new SimpleGrantedAuthority("ROLE_" + customer.getCustomerType().name())
        );
    }

    public String getAuthoritiesString() {
        return "ROLE_CUSTOMER,ROLE_" + customerType.name();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return active;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
