package com.fabio.flashcards_app.data.dto.imports;

import java.util.List;

public record FlashcardImportResultDTO(
        int imported,
        int skipped,
        List<String> errors
) {
}
