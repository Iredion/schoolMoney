package com.schoolmoney.model;

import com.schoolmoney.model.enums.FundraiserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "fundraisers")
public class Fundraiser {

    @Id
    private String id;

    private String classId;
    private String creatorId;
    private String title;
    private String description;
    private String logoUrl;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal amountPerChild;

    @Indexed(unique = true)
    private String virtualAccountNumber;

    @Builder.Default
    private BigDecimal balance = BigDecimal.ZERO;

    @Builder.Default
    private FundraiserStatus status = FundraiserStatus.ACTIVE;

    @Builder.Default
    private List<String> receiptUrls = new ArrayList<>();

    @Builder.Default
    private boolean isBlocked = false;

    @Builder.Default
    private boolean isPublic = false;
}