package com.schoolmoney.controller;

import com.schoolmoney.dto.ClassRequest;
import com.schoolmoney.model.SchoolClass;
import com.schoolmoney.service.SchoolClassService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class SchoolClassController {

    private final SchoolClassService schoolClassService;

    @PostMapping
    public ResponseEntity<SchoolClass> createClass(@RequestBody ClassRequest request, @RequestAttribute("userId") String userId) {
        return ResponseEntity.ok(schoolClassService.createClass(request, userId));
    }

    @GetMapping("/my")
    public ResponseEntity<List<SchoolClass>> getMyClasses(@RequestAttribute("userId") String userId) {
        return ResponseEntity.ok(schoolClassService.getMyClasses(userId));
    }

    @GetMapping("/token/{token}")
    public ResponseEntity<SchoolClass> getClassByToken(@PathVariable String token) {
        return ResponseEntity.ok(schoolClassService.getClassByToken(token));
    }
}