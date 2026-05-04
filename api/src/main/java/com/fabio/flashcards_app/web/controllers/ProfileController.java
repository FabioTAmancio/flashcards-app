package com.fabio.flashcards_app.web.controllers;

import com.fabio.flashcards_app.data.dto.User.ProfileResponseDTO;
import com.fabio.flashcards_app.data.dto.User.ProfileUpdateDTO;
import com.fabio.flashcards_app.domain.models.User;
import com.fabio.flashcards_app.domain.services.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/profile")
public class ProfileController {

    @Autowired
    ProfileService profileService;

    @GetMapping
    public ResponseEntity<ProfileResponseDTO> getProfile(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(profileService.getProfile(user));
    }

    @PatchMapping
    public ResponseEntity<ProfileResponseDTO> update(
            @RequestBody ProfileUpdateDTO dto,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(profileService.updateProfile(dto, user));
    }

    @PostMapping("/avatar")
    public ResponseEntity<ProfileResponseDTO> updateAvatar(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user
    ) throws Exception {
        return ResponseEntity.ok(profileService.uploadAvatar(file, user));
    }

    @PostMapping("/upgrade")
    public ResponseEntity<ProfileResponseDTO> upgrade(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(profileService.upgradeToPremium(user));
    }

    @PostMapping("/donwgrade")
    public ResponseEntity<ProfileResponseDTO> downgrade(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(profileService.downgradeToFree(user));
    }
}
