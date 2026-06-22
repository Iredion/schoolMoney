package com.schoolmoney.repository;

import com.schoolmoney.model.Child;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChildRepository extends MongoRepository<Child, String> {
    List<Child> findByParentId(String parentId);
    List<Child> findByClassId(String classId);
}