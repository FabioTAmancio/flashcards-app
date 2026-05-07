package com.fabio.flashcards_app.data.dto.Folder;

import com.fabio.flashcards_app.data.dto.deck.DeckResponseDTO;

import java.util.List;

public record FolderResponseDTO(
        Long id,
        String name,
        Long parentId,
        Boolean reviewEnabled,
        List<FolderResponseDTO> children,
        List<DeckResponseDTO> decks
) {
}
