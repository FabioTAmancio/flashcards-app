package com.fabio.flashcards_app.web.controllers;

import com.fabio.flashcards_app.data.dto.Folder.FolderRequestDTO;
import com.fabio.flashcards_app.data.dto.Folder.FolderResponseDTO;
import com.fabio.flashcards_app.data.dto.deck.DeckResponseDTO;
import com.fabio.flashcards_app.domain.models.User;
import com.fabio.flashcards_app.domain.services.FolderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/folders")
public class FolderController {

    @Autowired private FolderService folderService;

    @GetMapping
    public ResponseEntity<List<FolderResponseDTO>> getTree(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(folderService.getTree(user));
    }

    @PostMapping
    public ResponseEntity<FolderResponseDTO> create(
            @RequestBody FolderRequestDTO dto,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(201).body(folderService.create(dto, user));
    }

    @PatchMapping("/{id}/rename")
    public ResponseEntity<FolderResponseDTO> rename(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(folderService.rename(id, body.get("name"), user));
    }

    @PatchMapping("/{id}/move")
    public ResponseEntity<FolderResponseDTO> move(
            @PathVariable Long id,
            @RequestBody Map<String, Long> body,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(folderService.move(id, body.get("parentId"), user));
    }

    @PatchMapping("/{id}/decks/{deckId}")
    public ResponseEntity<DeckResponseDTO> moveDeckToFolder(
            @PathVariable Long id,
            @PathVariable Long deckId,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(folderService.moveDeckToFolder(deckId, id, user));
    }

    @PatchMapping("/decks/{deckId}/remove")
    public ResponseEntity<DeckResponseDTO> removeDeckFromFolder(
            @PathVariable Long deckId,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(folderService.moveDeckToFolder(deckId, null, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        folderService.delete(id, user);
        return ResponseEntity.noContent().build();
    }
}
