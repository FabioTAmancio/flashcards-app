package com.fabio.flashcards_app.web.controllers;

import com.fabio.flashcards_app.data.dto.imports.ApkgConfirmDTO;
import com.fabio.flashcards_app.data.dto.imports.ApkgPreviewDTO;
import com.fabio.flashcards_app.data.dto.imports.ApkgStructuredResultDTO;
import com.fabio.flashcards_app.domain.models.User;
import com.fabio.flashcards_app.domain.services.ApkgStructuredImportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/flashcards/import/anki")
public class ApkgStructuredImportController {

    @Autowired
    private ApkgStructuredImportService service;

    @PostMapping("/preview")
    public ResponseEntity<?> preview(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user
    ) {
        if(!user.isPremium()) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "PREMIUM_REQUIRED",
                    "message", "Deck anki import is exclusive to PREMIUM Users"
            ));
        }

        String filename = file.getOriginalFilename();
        if(filename == null || !filename.toLowerCase().endsWith(".apkg")) {
            return ResponseEntity.badRequest().body(Map.of("error", "File needs to be .apkg"));
        }

        if(file.getSize() > 150L * 1024 * 1024) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is too big"));
        }

        try {
            ApkgPreviewDTO preview = service.preview(file, user);
            return ResponseEntity.ok(preview);
        } catch(Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Fail to read the file: " + e.getMessage()));
        }
    }

    @PostMapping("/confirm")
    public ResponseEntity<?> confirm(
            @RequestBody ApkgConfirmDTO dto,
            @AuthenticationPrincipal User user
    ) {
        if(!user.isPremium()) {
            return ResponseEntity.status(403).body(Map.of("error", "PREMIUM_REQUIRED"));
        }

        try {
            ApkgStructuredResultDTO result = service.confirm(dto, user);
            return ResponseEntity.ok(result);
        } catch(Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
