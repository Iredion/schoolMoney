package com.schoolmoney.service;

import com.schoolmoney.dto.AuthResponse;
import com.schoolmoney.dto.LoginRequest;
import com.schoolmoney.dto.RegisterRequest;
import com.schoolmoney.dto.UpdateUserRequest;
import com.schoolmoney.model.User;
import com.schoolmoney.model.enums.Role;
import com.schoolmoney.repository.UserRepository;
import com.schoolmoney.util.JwtUtil;
import com.schoolmoney.util.PasswordUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public User registerUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already in use");
        }

        String virtualAccount = generateVirtualAccountNumber();
        while (userRepository.findByVirtualAccountNumber(virtualAccount).isPresent()) {
            virtualAccount = generateVirtualAccountNumber();
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(PasswordUtil.hash(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .avatarUrl(request.getAvatarUrl())
                .role(request.getRole() != null ? request.getRole() : Role.ROLE_PARENT)
                .virtualAccountNumber(virtualAccount)
                .balance(BigDecimal.ZERO)
                .isBlocked(false)
                .build();

        return userRepository.save(user);
    }

    public AuthResponse loginUser(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!user.getPassword().equals(PasswordUtil.hash(request.getPassword()))) {
            throw new RuntimeException("Invalid credentials");
        }

        if (user.isBlocked()) {
            throw new RuntimeException("User is blocked");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .build();
    }

    public AuthResponse updateProfile(String userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        user.setAvatarUrl(request.getAvatarUrl());

        userRepository.save(user);

        return AuthResponse.builder()
                .token(jwtUtil.generateToken(user.getId(), user.getRole().name()))
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .build();
    }

    public User getCurrentUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private String generateVirtualAccountNumber() {
        return UUID.randomUUID().toString().replaceAll("[^0-9]", "").substring(0, 16);
    }
}