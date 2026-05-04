package com.fabio.flashcards_app.data.dto.imports;

import java.util.Map;

public record ApkgConfirmDTO(
        String uploadToken,
        // Map of ankiDeckId -> user resolution
        //USE_EXISTING or CREATE_NEW
        Map<Long, String> resolution
) {
}
