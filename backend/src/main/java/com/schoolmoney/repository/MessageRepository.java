package com.schoolmoney.repository;

import com.schoolmoney.model.Message;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findByClassIdOrderByTimestampAsc(String classId);
    List<Message> findBySenderIdOrReceiverIdOrderByTimestampAsc(String senderId, String receiverId);
}