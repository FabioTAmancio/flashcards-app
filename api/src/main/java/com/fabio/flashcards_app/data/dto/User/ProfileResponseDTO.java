package com.fabio.flashcards_app.data.dto.User;

public record ProfileResponseDTO(
        Long id,
        String name,
        String email,
        String avatarUrl,
        String plan,
        Boolean emailVerified,
        int totalDecks,
        int totalCards,
        int currentStreak
) {
}
