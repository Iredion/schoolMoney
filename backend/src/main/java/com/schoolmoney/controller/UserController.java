package com.schoolmoney.controller;

import com.schoolmoney.dto.AuthResponse;
import com.schoolmoney.dto.UpdateUserRequest;
import com.schoolmoney.dto.UserSummaryDto;
import com.schoolmoney.repository.UserRepository;
import com.schoolmoney.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<List<UserSummaryDto>> getAllUsers() {
        List<UserSummaryDto> users = userRepository.findAll().stream()
                .map(user -> UserSummaryDto.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .avatarUrl(user.getAvatarUrl())
                        .role(user.getRole())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PutMapping("/me")
    public ResponseEntity<AuthResponse> updateProfile(
            @RequestBody UpdateUserRequest request,
            @RequestAttribute("userId") String userId) {
        return ResponseEntity.ok(authService.updateProfile(userId, request));
    }

    @GetMapping("/me")
    public ResponseEntity<com.schoolmoney.model.User> getCurrentUser(@RequestAttribute("userId") String userId) {
        return ResponseEntity.ok(authService.getCurrentUser(userId));
    }
}
