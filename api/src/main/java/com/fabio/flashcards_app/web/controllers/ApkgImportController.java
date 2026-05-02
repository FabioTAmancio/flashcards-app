package com.fabio.flashcards_app.web.controllers;

import com.fabio.flashcards_app.data.dto.imports.ApkgImportResultDTO;
import com.fabio.flashcards_app.domain.models.User;
import com.fabio.flashcards_app.domain.services.ApkgImportService;
import jakarta.websocket.server.PathParam;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/import")
public class ApkgImportController {

    @Autowired
    private ApkgImportService apkgImportService;

    @PostMapping("/apkg/{deckId}")
    public ResponseEntity<?> importApkg(
            @PathVariable("deckId") Long deckId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user
    ) {
        String filename = file.getOriginalFilename();
        if(filename == null || !filename.toLowerCase().endsWith(".apkg")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "File must be .apkg"));
        }

        if(file.getSize() > 50L * 1024 * 1024) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "File is too big. The limit is 50MB!"));
        }

        try {
            ApkgImportResultDTO result = apkgImportService.importApkg(file, deckId, user);
            return ResponseEntity.ok(result);
        } catch(Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to process the file: " + e.getMessage()));
        }
    }
}
