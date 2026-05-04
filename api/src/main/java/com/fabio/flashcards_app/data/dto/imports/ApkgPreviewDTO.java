package com.fabio.flashcards_app.data.dto.imports;

import java.util.List;

public record ApkgPreviewDTO(
        String uploadToken,
        List<AnkiDeckPreview> decks
) {
    public record AnkiDeckPreview(
            Long ankiDeckId,
            String fullPath,
            String deckName,
            String folderPath,
            int cardCount,
            Long existingDeckId,
            String existingDeckName,
            ConflictResolution resolution
    ) {
        public enum ConflictResolution {
            USE_EXISTING,
            CREATE_NEW,
        }
    }
}
