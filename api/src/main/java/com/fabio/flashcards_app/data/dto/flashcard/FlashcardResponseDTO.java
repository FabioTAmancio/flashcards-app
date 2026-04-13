package com.fabio.flashcards_app.data.dto.flashcard;

public record FlashcardResponseDTO(
        Long id,
        String front,
        String back,
        String subject,
        Long deckId
) {
}
