package com.schoolmoney.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class FileUploadController {

    private static final Path UPLOAD_DIR = Paths.get("uploads").toAbsolutePath().normalize();
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    @PostMapping
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Plik jest pusty"));
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest().body(Map.of("message", "Plik jest za duży (max 5 MB)"));
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Dozwolone są tylko pliki graficzne"));
        }

        try {
            Files.createDirectories(UPLOAD_DIR);

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = UUID.randomUUID() + extension;

            Path targetPath = UPLOAD_DIR.resolve(filename).normalize();
            if (!targetPath.startsWith(UPLOAD_DIR)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Nieprawidłowa nazwa pliku"));
            }

            file.transferTo(targetPath.toFile());

            String url = "/api/uploads/" + filename;
            return ResponseEntity.ok(Map.of("url", url));

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Błąd zapisu pliku: " + e.getMessage()));
        }
    }
}
