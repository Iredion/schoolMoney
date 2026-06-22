package com.schoolmoney.service;

import com.schoolmoney.dto.FundraiserRequest;
import com.schoolmoney.model.Fundraiser;
import com.schoolmoney.model.SchoolClass;
import com.schoolmoney.model.Transaction;
import com.schoolmoney.model.User;
import com.schoolmoney.model.enums.FundraiserStatus;
import com.schoolmoney.model.enums.TransactionType;
import com.schoolmoney.repository.FundraiserRepository;
import com.schoolmoney.repository.SchoolClassRepository;
import com.schoolmoney.repository.TransactionRepository;
import com.schoolmoney.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FundraiserService {

    private final FundraiserRepository fundraiserRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public Fundraiser createFundraiser(FundraiserRequest request, String userId) {
        SchoolClass schoolClass = schoolClassRepository.findById(request.getClassId())
                .orElseThrow(() -> new RuntimeException("Class not found"));

        String virtualAccount = generateVirtualAccountNumber();
        while (fundraiserRepository.findByVirtualAccountNumber(virtualAccount).isPresent()) {
            virtualAccount = generateVirtualAccountNumber();
        }

        Fundraiser fundraiser = Fundraiser.builder()
                .classId(schoolClass.getId())
                .creatorId(userId)
                .title(request.getTitle())
                .description(request.getDescription())
                .logoUrl(request.getLogoUrl())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .amountPerChild(request.getAmountPerChild())
                .virtualAccountNumber(virtualAccount)
                .isPublic(request.isPublic())
                .build();

        return fundraiserRepository.save(fundraiser);
    }

    public List<Fundraiser> getClassFundraisers(String classId) {
        return fundraiserRepository.findByClassId(classId);
    }

    public Fundraiser addReceipt(String fundraiserId, String receiptUrl, String userId) {
        Fundraiser fundraiser = fundraiserRepository.findById(fundraiserId)
                .orElseThrow(() -> new RuntimeException("Fundraiser not found"));

        if (!fundraiser.getCreatorId().equals(userId)) {
            throw new RuntimeException("Only creator can add receipts");
        }

        fundraiser.getReceiptUrls().add(receiptUrl);
        return fundraiserRepository.save(fundraiser);
    }

    public Fundraiser closeFundraiser(String fundraiserId, String userId) {
        Fundraiser fundraiser = fundraiserRepository.findById(fundraiserId)
                .orElseThrow(() -> new RuntimeException("Fundraiser not found"));

        if (!fundraiser.getCreatorId().equals(userId)) {
            throw new RuntimeException("Only creator can close");
        }

        if (fundraiser.getStatus() == FundraiserStatus.CLOSED) {
            throw new RuntimeException("Fundraiser is already closed");
        }

        // Automatic refund logic
        if (fundraiser.getBalance().compareTo(BigDecimal.ZERO) > 0) {
            List<Transaction> transactions = transactionRepository.findByFundraiserId(fundraiserId);
            Set<String> validPayers = new HashSet<>();
            
            for (Transaction t : transactions) {
                if (t.getType() == TransactionType.PAYMENT_FOR_CHILD) {
                    validPayers.add(t.getPayerId());
                } else if (t.getType() == TransactionType.REFUND) {
                    // Note: If a payer got a full refund, they might still be in validPayers if they paid for multiple children,
                    // but for simplicity we'll just distribute to all unique payerIds who made at least one payment.
                    // This is a basic distribution.
                }
            }

            if (!validPayers.isEmpty()) {
                BigDecimal amountPerUser = fundraiser.getBalance().divide(new BigDecimal(validPayers.size()), 2, RoundingMode.HALF_DOWN);
                BigDecimal totalRefunded = BigDecimal.ZERO;

                int count = 0;
                for (String payerId : validPayers) {
                    count++;
                    User payer = userRepository.findById(payerId).orElse(null);
                    if (payer != null) {
                        // For the last user, give them the exact remainder to avoid losing cents
                        BigDecimal currentRefund = amountPerUser;
                        if (count == validPayers.size()) {
                            currentRefund = fundraiser.getBalance().subtract(totalRefunded);
                        }

                        if (currentRefund.compareTo(BigDecimal.ZERO) > 0) {
                            payer.setBalance(payer.getBalance().add(currentRefund));
                            userRepository.save(payer);

                            Transaction refundTx = Transaction.builder()
                                    .fromAccountNumber(fundraiser.getVirtualAccountNumber())
                                    .toAccountNumber(payer.getVirtualAccountNumber())
                                    .amount(currentRefund)
                                    .type(TransactionType.REFUND)
                                    .fundraiserId(fundraiser.getId())
                                    .classId(fundraiser.getClassId())
                                    .payerId(payerId)
                                    .build();
                            transactionRepository.save(refundTx);
                            
                            totalRefunded = totalRefunded.add(currentRefund);
                        }
                    }
                }
                
                fundraiser.setBalance(BigDecimal.ZERO);
            }
        }

        fundraiser.setStatus(FundraiserStatus.CLOSED);
        return fundraiserRepository.save(fundraiser);
    }

    private String generateVirtualAccountNumber() {
        return UUID.randomUUID().toString().replaceAll("[^0-9]", "").substring(0, 16);
    }
}