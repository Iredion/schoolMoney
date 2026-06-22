package com.schoolmoney.controller;

import com.schoolmoney.dto.ChatMessageRequest;
import com.schoolmoney.model.Message;
import com.schoolmoney.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.class")
    public void sendClassMessage(@Payload ChatMessageRequest request, Principal principal) {
        if (principal == null) return;
        Message savedMessage = messageService.saveMessage(principal.getName(), request);
        messagingTemplate.convertAndSend("/topic/class/" + request.getClassId(), savedMessage);
    }

    @MessageMapping("/chat.private")
    public void sendPrivateMessage(@Payload ChatMessageRequest request, Principal principal) {
        if (principal == null) return;
        Message savedMessage = messageService.saveMessage(principal.getName(), request);
        messagingTemplate.convertAndSendToUser(request.getReceiverId(), "/queue/messages", savedMessage);
        messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/messages", savedMessage);
    }
}