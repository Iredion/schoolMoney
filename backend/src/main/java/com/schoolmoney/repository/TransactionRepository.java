package com.schoolmoney.repository;

import com.schoolmoney.model.Transaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends MongoRepository<Transaction, String> {
    List<Transaction> findByFundraiserId(String fundraiserId);
    List<Transaction> findByClassId(String classId);
    List<Transaction> findByPayerId(String payerId);
    List<Transaction> findByFundraiserIdAndChildIdAndType(String fundraiserId, String childId, com.schoolmoney.model.enums.TransactionType type);
}