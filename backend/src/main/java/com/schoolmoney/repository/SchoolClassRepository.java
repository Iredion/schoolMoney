package com.schoolmoney.repository;

import com.schoolmoney.model.SchoolClass;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SchoolClassRepository extends MongoRepository<SchoolClass, String> {
    boolean existsByName(String name);
    Optional<SchoolClass> findByInviteToken(String inviteToken);
    List<SchoolClass> findByTreasurerId(String treasurerId);
}