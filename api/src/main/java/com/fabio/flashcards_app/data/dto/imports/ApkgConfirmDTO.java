package com.fabio.flashcards_app.data.dto.imports;

import java.util.Map;

public record ApkgConfirmDTO(
        String uploadToken,
        // Mapa de ankiDeckId -> resolução do usuário
        // "USE_EXISTING" ou "CREATE_NEW"
        Map<Long, String> resolutions
) {}

