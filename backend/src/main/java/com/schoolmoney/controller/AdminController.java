package com.schoolmoney.controller;

import com.schoolmoney.model.Fundraiser;
import com.schoolmoney.model.Transaction;
import com.schoolmoney.model.User;
import com.schoolmoney.service.AdminService;
import com.schoolmoney.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final TransactionService transactionService;

    private void verifyAdmin(String role) {
        if (!"ROLE_ADMIN".equals(role)) {
            throw new RuntimeException("Access denied: Admin only");
        }
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers(@RequestAttribute("userRole") String role) {
        verifyAdmin(role);
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/treasurers")
    public ResponseEntity<List<User>> getAllTreasurers(@RequestAttribute("userRole") String role) {
        verifyAdmin(role);
        return ResponseEntity.ok(adminService.getAllTreasurers());
    }

    @PatchMapping("/users/{userId}/block")
    public ResponseEntity<User> toggleUserBlock(@PathVariable String userId, @RequestAttribute("userRole") String role) {
        verifyAdmin(role);
        return ResponseEntity.ok(adminService.toggleUserBlock(userId));
    }

    @GetMapping("/fundraisers")
    public ResponseEntity<List<Fundraiser>> getAllFundraisers(@RequestAttribute("userRole") String role) {
        verifyAdmin(role);
        return ResponseEntity.ok(adminService.getAllFundraisers());
    }

    @PatchMapping("/fundraisers/{fundraiserId}/block")
    public ResponseEntity<Fundraiser> toggleFundraiserBlock(@PathVariable String fundraiserId, @RequestAttribute("userRole") String role) {
        verifyAdmin(role);
        return ResponseEntity.ok(adminService.toggleFundraiserBlock(fundraiserId));
    }

    @GetMapping("/reports/fundraiser/{fundraiserId}")
    public ResponseEntity<List<Transaction>> getFundraiserReport(@PathVariable String fundraiserId, @RequestAttribute("userRole") String role) {
        verifyAdmin(role);
        return ResponseEntity.ok(transactionService.getFundraiserTransactions(fundraiserId));
    }

    @GetMapping("/reports/class/{classId}")
    public ResponseEntity<List<Transaction>> getClassReport(@PathVariable String classId, @RequestAttribute("userRole") String role) {
        verifyAdmin(role);
        return ResponseEntity.ok(transactionService.getClassTransactions(classId));
    }

    @GetMapping("/classes")
    public ResponseEntity<List<com.schoolmoney.model.SchoolClass>> getAllClasses(@RequestAttribute("userRole") String role) {
        verifyAdmin(role);
        return ResponseEntity.ok(adminService.getAllClasses());
    }

    @GetMapping("/children")
    public ResponseEntity<List<com.schoolmoney.model.Child>> getAllChildren(@RequestAttribute("userRole") String role) {
        verifyAdmin(role);
        return ResponseEntity.ok(adminService.getAllChildren());
    }
}