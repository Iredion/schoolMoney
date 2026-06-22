package com.schoolmoney.repository;

import com.schoolmoney.model.Fundraiser;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FundraiserRepository extends MongoRepository<Fundraiser, String> {
    List<Fundraiser> findByClassId(String classId);
    Optional<Fundraiser> findByVirtualAccountNumber(String virtualAccountNumber);
}