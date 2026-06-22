package com.schoolmoney.service;

import com.schoolmoney.dto.ChatMessageRequest;
import com.schoolmoney.model.Message;
import com.schoolmoney.repository.MessageRepository;
import com.schoolmoney.repository.SchoolClassRepository;
import com.schoolmoney.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SchoolClassRepository schoolClassRepository;

    public Message saveMessage(String senderId, ChatMessageRequest request) {
        if (request.getReceiverId() != null) {
            userRepository.findById(request.getReceiverId())
                    .orElseThrow(() -> new RuntimeException("Receiver user not found"));
        }
        if (request.getClassId() != null) {
            schoolClassRepository.findById(request.getClassId())
                    .orElseThrow(() -> new RuntimeException("Class not found"));
        }

        Message message = Message.builder()
                .senderId(senderId)
                .receiverId(request.getReceiverId())
                .classId(request.getClassId())
                .content(request.getContent())
                .build();

        return messageRepository.save(message);
    }

    public List<Message> getClassHistory(String classId) {
        return messageRepository.findByClassIdOrderByTimestampAsc(classId);
    }

    public List<Message> getPrivateHistory(String userId) {
        return messageRepository.findBySenderIdOrReceiverIdOrderByTimestampAsc(userId, userId);
    }
}