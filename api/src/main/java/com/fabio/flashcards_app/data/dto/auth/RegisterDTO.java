package com.fabio.flashcards_app.data.dto.auth;

public record RegisterDTO(
        String name,
        String email,
        String password
) {
}
