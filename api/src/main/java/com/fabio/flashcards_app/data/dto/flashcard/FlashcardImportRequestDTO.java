package com.fabio.flashcards_app.data.dto.flashcard;

public record FlashcardImportRequestDTO(
        String front,
        String back,
        String subject
) {
}
