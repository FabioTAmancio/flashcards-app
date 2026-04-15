package com.fabio.flashcards_app.data.dto.flashcard;

public record FlashcardRequestDTO(
        String front,
        String back,
        String subject,
        Long deckId
) {
}
