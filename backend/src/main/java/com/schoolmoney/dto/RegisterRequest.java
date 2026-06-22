package com.schoolmoney.dto;

import com.schoolmoney.model.enums.Role;
import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String password;
    private String firstName;
    private String lastName;
    private String avatarUrl;
    private Role role;
}