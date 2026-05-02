package com.fabio.flashcards_app.data.dto.imports;

import java.util.List;

public record ApkgImportResultDTO(
        int imported,
        int skipped,
        int imagesUploaded,
        List<String> errors
) {
}
