package com.fabio.flashcards_app.data.dto.flashcard;

public record FlashcardRequestDTO(
        String front,
        String back,
        String subject,
        Long deckId,
        String frontImageUrl,
        String backImageUrl,
        String cardType // "BASIC" or "QA" - null use BASIC as default
) {
}
