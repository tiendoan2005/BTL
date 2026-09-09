package com.bank.admin.staff;

import com.bank.admin.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "staff_profiles")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class StaffProfile {

    @Id
    @Column(name = "staff_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "staff_id")
    private User user;

    @Column(name = "employee_code", nullable = false, unique = true, length = 50)
    private String employeeCode;

    @Column(length = 100)
    private String department;

    @Column(length = 100)
    private String position;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(columnDefinition = "TEXT")
    private String address;
}
