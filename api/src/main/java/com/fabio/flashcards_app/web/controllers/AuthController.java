package com.fabio.flashcards_app.web.controllers;

import com.fabio.flashcards_app.data.dto.auth.AuthResponseDTO;
import com.fabio.flashcards_app.data.dto.auth.LoginDTO;
import com.fabio.flashcards_app.data.dto.auth.RegisterDTO;
import com.fabio.flashcards_app.domain.services.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;


@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(
            @RequestBody RegisterDTO dto) {
        return ResponseEntity.status(201).body(authService.register(dto));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(
            @RequestBody LoginDTO dto
    ) {
        return ResponseEntity.ok(authService.login(dto));
    }

    @GetMapping("/verify")
    public ResponseEntity<Void> verify(
            @RequestParam String token
    ) {
        try {
            authService.verifyEmail(token);
            return ResponseEntity
                    .status(302)
                    .header("Location", frontendUrl + "/decks?verified=true")
                    .build();
        } catch (Exception e) {
            return ResponseEntity
                    .status(302)
                    .header("Location", frontendUrl, "/decks?verified=false")
                    .build();
        }
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, String>> resendVerification(
            @RequestBody Map<String, String> body
    ) {
        authService.resendVerification(body.get("email"));
        return ResponseEntity.ok(Map.of("message", "Email reenviado com sucesso"));
    }
}
