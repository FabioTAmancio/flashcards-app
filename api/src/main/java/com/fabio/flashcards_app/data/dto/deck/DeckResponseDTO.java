package com.fabio.flashcards_app.data.dto.deck;

public record DeckResponseDTO(
        Long id,
        String name,
        String description,
        String color,
        String subject,
        Boolean isPublic,
        Boolean reviewEnabled,
        Integer cardCount
) {
}
