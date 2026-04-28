package com.fabio.flashcards_app.data.dto.flashcard;

import java.util.List;

public record FlashcardImportResultDTO(
        int imported,
        int skipped,
        List<String> errors
) {
}
