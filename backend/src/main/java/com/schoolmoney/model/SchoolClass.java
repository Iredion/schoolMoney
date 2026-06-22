package com.schoolmoney.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "classes")
public class SchoolClass {

    @Id
    private String id;

    @Indexed(unique = true)
    private String name;

    private String treasurerId;
    private String inviteToken;
}