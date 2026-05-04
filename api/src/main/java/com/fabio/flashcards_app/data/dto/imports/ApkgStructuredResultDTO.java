package com.fabio.flashcards_app.data.dto.imports;

import java.util.List;

public record ApkgStructuredResultDTO(
        int decksCreated,
        int decksReused,
        int foldersCreated,
        int cardsImported,
        int cardsSkipped,
        int imagesUploaded,
        List<String> errors
) {
}
