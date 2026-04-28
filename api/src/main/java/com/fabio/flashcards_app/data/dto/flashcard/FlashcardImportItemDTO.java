package com.fabio.flashcards_app.data.dto.flashcard;

public record FlashcardImportItemDTO(
        String front,
        String back,
        String subject
) {
}
