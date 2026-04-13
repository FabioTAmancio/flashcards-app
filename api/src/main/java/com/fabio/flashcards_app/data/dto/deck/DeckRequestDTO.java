package com.fabio.flashcards_app.data.dto.deck;

public record DeckRequestDTO(
        String name,
        String description,
        String color,
        String subject,
        Boolean isPublic
) {
}
