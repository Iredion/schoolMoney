package com.schoolmoney.service;

import com.schoolmoney.dto.ChildRequest;
import com.schoolmoney.dto.UpdateChildRequest;
import com.schoolmoney.model.Child;
import com.schoolmoney.model.SchoolClass;
import com.schoolmoney.repository.ChildRepository;
import com.schoolmoney.repository.SchoolClassRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChildService {

    private final ChildRepository childRepository;
    private final SchoolClassService schoolClassService;
    private final SchoolClassRepository schoolClassRepository;

    public Child addChild(ChildRequest request, String parentId) {
        Child child = Child.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .avatarUrl(request.getAvatarUrl())
                .dateOfBirth(request.getDateOfBirth())
                .parentId(parentId)
                .build();
        return childRepository.save(child);
    }

    public List<Child> getMyChildren(String parentId) {
        return childRepository.findByParentId(parentId);
    }

    public Child assignToClass(String childId, String inviteToken, String parentId) {
        Child child = childRepository.findById(childId)
                .orElseThrow(() -> new RuntimeException("Child not found"));

        if (!child.getParentId().equals(parentId)) {
            throw new RuntimeException("Not your child");
        }

        SchoolClass schoolClass = schoolClassService.getClassByToken(inviteToken);
        child.setClassId(schoolClass.getId());

        return childRepository.save(child);
    }

    public Child leaveClass(String childId, String parentId) {
        Child child = childRepository.findById(childId)
                .orElseThrow(() -> new RuntimeException("Child not found"));

        if (!child.getParentId().equals(parentId)) {
            throw new RuntimeException("Not your child");
        }

        child.setClassId(null);
        return childRepository.save(child);
    }

    public Child updateChild(String childId, UpdateChildRequest request, String parentId) {
        Child child = childRepository.findById(childId)
                .orElseThrow(() -> new RuntimeException("Child not found"));

        if (!child.getParentId().equals(parentId)) {
            throw new RuntimeException("Not your child");
        }

        if (request.getFirstName() != null) {
            child.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            child.setLastName(request.getLastName());
        }
        child.setAvatarUrl(request.getAvatarUrl());

        return childRepository.save(child);
    }

    public void deleteChild(String childId, String parentId) {
        Child child = childRepository.findById(childId)
                .orElseThrow(() -> new RuntimeException("Child not found"));

        if (!child.getParentId().equals(parentId)) {
            throw new RuntimeException("Not your child");
        }

        childRepository.delete(child);
    }

    public List<Child> getClassChildren(String classId, String userId) {
        SchoolClass schoolClass = schoolClassRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        boolean isTreasurer = schoolClass.getTreasurerId().equals(userId);
        boolean hasChildInClass = childRepository.findByParentId(userId).stream()
                .anyMatch(c -> classId.equals(c.getClassId()));

        if (!isTreasurer && !hasChildInClass) {
            throw new RuntimeException("Only treasurer or parents in this class can view the children");
        }

        return childRepository.findByClassId(classId);
    }
}