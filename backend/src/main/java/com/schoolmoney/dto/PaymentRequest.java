package com.schoolmoney.dto;

import lombok.Data;

@Data
public class PaymentRequest {
    private String fundraiserId;
    private String childId;
}