package com.fabio.flashcards_app.data.dto.auth;

public record AuthResponseDTO(
        String token,
        String name,
        String email,
        String role,
        Boolean emailVerified
) {
}
