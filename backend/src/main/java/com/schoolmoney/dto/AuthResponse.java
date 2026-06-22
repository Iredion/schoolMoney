package com.schoolmoney.dto;

import com.schoolmoney.model.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token;
    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private Role role;
}