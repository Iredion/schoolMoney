package com.schoolmoney.controller;

import com.schoolmoney.dto.DepositRequest;
import com.schoolmoney.dto.PaymentRequest;
import com.schoolmoney.dto.WithdrawalRequest;
import com.schoolmoney.model.Transaction;
import com.schoolmoney.model.User;
import com.schoolmoney.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping("/deposit")
    public ResponseEntity<User> deposit(@RequestBody DepositRequest request, @RequestAttribute("userId") String userId) {
        return ResponseEntity.ok(transactionService.depositFunds(userId, request));
    }

    @PostMapping("/pay")
    public ResponseEntity<Transaction> payForChild(@RequestBody PaymentRequest request, @RequestAttribute("userId") String userId) {
        return ResponseEntity.ok(transactionService.payForChild(userId, request));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<Transaction> withdraw(@RequestBody WithdrawalRequest request, @RequestAttribute("userId") String userId) {
        return ResponseEntity.ok(transactionService.withdrawFromFundraiser(userId, request));
    }

    @PostMapping("/refund/{fundraiserId}/{childId}")
    public ResponseEntity<Transaction> refundPayment(
            @PathVariable String fundraiserId,
            @PathVariable String childId,
            @RequestAttribute("userId") String userId) {
        return ResponseEntity.ok(transactionService.refundPayment(userId, fundraiserId, childId));
    }

    @GetMapping("/fundraiser/{fundraiserId}")
    public ResponseEntity<List<Transaction>> getFundraiserReport(@PathVariable String fundraiserId) {
        return ResponseEntity.ok(transactionService.getFundraiserTransactions(fundraiserId));
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<Transaction>> getClassReport(@PathVariable String classId) {
        return ResponseEntity.ok(transactionService.getClassTransactions(classId));
    }
}