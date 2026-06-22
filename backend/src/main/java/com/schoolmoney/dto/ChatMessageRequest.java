package com.schoolmoney.dto;

import lombok.Data;

@Data
public class ChatMessageRequest {
    private String receiverId;
    private String classId;
    private String content;
}