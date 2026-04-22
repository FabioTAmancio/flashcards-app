package com.fabio.flashcards_app.web.controllers;

import com.fabio.flashcards_app.data.dto.auth.AuthResponseDTO;
import com.fabio.flashcards_app.data.dto.auth.LoginDTO;
import com.fabio.flashcards_app.data.dto.auth.RegisterDTO;
import com.fabio.flashcards_app.domain.services.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "https://flash-dot.up.railway.app")
@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService service;

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(
            @RequestBody RegisterDTO dto) {
        return ResponseEntity.ok(service.register(dto));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(
            @RequestBody LoginDTO dto
    ) {
        return ResponseEntity.ok(service.login(dto));
    }
}
