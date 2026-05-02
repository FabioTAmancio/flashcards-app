package com.fabio.flashcards_app.data.dto.imports;

import java.util.List;

public record FlashcardImportDTO(
        Long deckId,
        List<FlashcardImportItemDTO> cards
) {
}
