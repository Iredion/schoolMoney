package com.schoolmoney.controller;

import com.schoolmoney.dto.ChildRequest;
import com.schoolmoney.dto.UpdateChildRequest;
import com.schoolmoney.model.Child;
import com.schoolmoney.service.ChildService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/children")
@RequiredArgsConstructor
public class ChildController {

    private final ChildService childService;

    @PostMapping
    public ResponseEntity<Child> addChild(@RequestBody ChildRequest request, @RequestAttribute("userId") String userId) {
        return ResponseEntity.ok(childService.addChild(request, userId));
    }

    @GetMapping
    public ResponseEntity<List<Child>> getMyChildren(@RequestAttribute("userId") String userId) {
        return ResponseEntity.ok(childService.getMyChildren(userId));
    }

    @PostMapping("/{childId}/join/{inviteToken}")
    public ResponseEntity<Child> assignToClass(@PathVariable String childId, @PathVariable String inviteToken, @RequestAttribute("userId") String userId) {
        return ResponseEntity.ok(childService.assignToClass(childId, inviteToken, userId));
    }

    @PostMapping("/{childId}/leave-class")
    public ResponseEntity<Child> leaveClass(@PathVariable String childId, @RequestAttribute("userId") String userId) {
        return ResponseEntity.ok(childService.leaveClass(childId, userId));
    }

    @PutMapping("/{childId}")
    public ResponseEntity<Child> updateChild(
            @PathVariable String childId,
            @RequestBody UpdateChildRequest request,
            @RequestAttribute("userId") String userId) {
        return ResponseEntity.ok(childService.updateChild(childId, request, userId));
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<Child>> getClassChildren(
            @PathVariable String classId,
            @RequestAttribute("userId") String userId) {
        return ResponseEntity.ok(childService.getClassChildren(classId, userId));
    }

    @DeleteMapping("/{childId}")
    public ResponseEntity<Void> deleteChild(
            @PathVariable String childId,
            @RequestAttribute("userId") String userId) {
        childService.deleteChild(childId, userId);
        return ResponseEntity.noContent().build();
    }
}