package com.schoolmoney.dto;

import com.schoolmoney.model.enums.Role;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserSummaryDto {
    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private String avatarUrl;
    private Role role;
}
