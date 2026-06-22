package com.schoolmoney.controller;

import com.schoolmoney.dto.FundraiserRequest;
import com.schoolmoney.model.Fundraiser;
import com.schoolmoney.service.FundraiserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fundraisers")
@RequiredArgsConstructor
public class FundraiserController {

    private final FundraiserService fundraiserService;

    @PostMapping
    public ResponseEntity<Fundraiser> createFundraiser(@RequestBody FundraiserRequest request, @RequestAttribute("userId") String userId) {
        return ResponseEntity.ok(fundraiserService.createFundraiser(request, userId));
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<Fundraiser>> getClassFundraisers(@PathVariable String classId) {
        return ResponseEntity.ok(fundraiserService.getClassFundraisers(classId));
    }

    @PatchMapping("/{id}/receipt")
    public ResponseEntity<Fundraiser> addReceipt(@PathVariable String id, @RequestParam String receiptUrl, @RequestAttribute("userId") String userId) {
        return ResponseEntity.ok(fundraiserService.addReceipt(id, receiptUrl, userId));
    }

    @PatchMapping("/{id}/close")
    public ResponseEntity<Fundraiser> closeFundraiser(@PathVariable String id, @RequestAttribute("userId") String userId) {
        return ResponseEntity.ok(fundraiserService.closeFundraiser(id, userId));
    }
}