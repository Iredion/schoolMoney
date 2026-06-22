package com.schoolmoney.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "children")
public class Child {

    @Id
    private String id;

    private String firstName;
    private String lastName;
    private String avatarUrl;
    private LocalDate dateOfBirth;
    private String parentId;
    private String classId;
}