package com.schoolmoney.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class ChildRequest {
    private String firstName;
    private String lastName;
    private String avatarUrl;
    private LocalDate dateOfBirth;
}