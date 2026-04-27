package com.fabio.flashcards_app.web.controllers;

import com.fabio.flashcards_app.data.dto.deck.DeckRequestDTO;
import com.fabio.flashcards_app.data.dto.deck.DeckResponseDTO;
import com.fabio.flashcards_app.domain.models.Deck;
import com.fabio.flashcards_app.domain.models.User;
import com.fabio.flashcards_app.domain.services.DeckService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/decks")
public class DeckController {

    @Autowired
    private DeckService deckService;

    @PostMapping()
    public ResponseEntity<DeckResponseDTO> create(
            @AuthenticationPrincipal User user,
            @RequestBody DeckRequestDTO dto
    ) {
        System.out.println("USER: " + user);
        return ResponseEntity.ok(deckService.createDeck(user, dto));
    }

    @GetMapping
    public ResponseEntity<List<DeckResponseDTO>> getAll(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(deckService.getUserDecks(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeckResponseDTO> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(deckService.getDeckById(id, user));
    }

    @PatchMapping("/{id}/toggle-review")
    public ResponseEntity<DeckResponseDTO> toggleReview(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(deckService.toggleReview(id, user));
    }


    @PutMapping("/{id}")
    public ResponseEntity<DeckResponseDTO> update(
            @PathVariable Long id,
            @RequestBody DeckRequestDTO dto,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(deckService.updateDeck(id, dto, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        deckService.deleteDeck(id, user);
        return ResponseEntity.noContent().build();
    }
}
