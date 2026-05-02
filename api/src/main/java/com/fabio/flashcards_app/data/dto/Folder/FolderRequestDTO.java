package com.fabio.flashcards_app.data.dto.Folder;

public record FolderRequestDTO(
        String name,
        Long parentId // null = root directory
) {
}
