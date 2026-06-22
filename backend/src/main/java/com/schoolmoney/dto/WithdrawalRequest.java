package com.schoolmoney.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class WithdrawalRequest {
    private String fundraiserId;
    private BigDecimal amount;
    private boolean external;
}