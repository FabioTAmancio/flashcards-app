package com.fabio.flashcards_app.data.dto.flashcard;

import java.util.List;

public record FlashcardImportDTO(
        Long deckId,
        List<FlashcardImportItemDTO> cards
) {
}
