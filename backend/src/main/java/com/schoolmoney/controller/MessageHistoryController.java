package com.schoolmoney.controller;

import com.schoolmoney.model.Message;
import com.schoolmoney.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageHistoryController {

    private final MessageService messageService;

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<Message>> getClassHistory(@PathVariable String classId) {
        return ResponseEntity.ok(messageService.getClassHistory(classId));
    }

    @GetMapping("/private")
    public ResponseEntity<List<Message>> getPrivateHistory(@RequestAttribute("userId") String userId) {
        return ResponseEntity.ok(messageService.getPrivateHistory(userId));
    }
}