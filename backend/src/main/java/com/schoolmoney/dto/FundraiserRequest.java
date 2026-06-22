package com.schoolmoney.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class FundraiserRequest {
    private String classId;
    private String title;
    private String description;
    private String logoUrl;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal amountPerChild;
    private boolean isPublic;
}