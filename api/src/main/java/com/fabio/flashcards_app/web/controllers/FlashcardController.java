package com.fabio.flashcards_app.web.controllers;

import com.fabio.flashcards_app.data.dto.flashcard.FlashcardImportRequestDTO;
import com.fabio.flashcards_app.data.dto.flashcard.FlashcardRequestDTO;
import com.fabio.flashcards_app.data.dto.flashcard.FlashcardResponseDTO;
import com.fabio.flashcards_app.domain.models.User;
import com.fabio.flashcards_app.domain.services.FlashcardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "https://flash-dot.up.railway.app")
@RestController
@RequestMapping("/flashcards")
public class FlashcardController {

    @Autowired
    private FlashcardService service;

    //create inside a deck
    @PostMapping()
    public ResponseEntity<FlashcardResponseDTO> create(
            @RequestBody FlashcardRequestDTO dto,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(201).body(service.create(dto.deckId(), dto, user));
    }

    //create all flashcards import to a one deck
    @PostMapping("/import/{deckId}")
    public ResponseEntity<?> importFlashcards(
            @PathVariable Long deckId,
            @RequestBody List<FlashcardImportRequestDTO> dtos,
            @AuthenticationPrincipal User user
    ) {
        service.importFlashcards(deckId, dtos, user);
        return ResponseEntity.ok().build();
    }

    // list by deck
    @GetMapping("/deck/{deckId}")
    public ResponseEntity<List<FlashcardResponseDTO>> getByDeck(
            @PathVariable Long deckId,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(service.getByDeck(deckId, user));
    }

    //get by id
    @GetMapping("/{id}")
    public ResponseEntity<FlashcardResponseDTO> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(service.getById(id, user));
    }

    // update all
    @PutMapping("")
    public ResponseEntity<FlashcardResponseDTO> update(
            @RequestBody FlashcardRequestDTO dto,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(service.update(dto.deckId(), dto, user));
    }

    // delete
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        service.delete(id, user);
        return ResponseEntity.ok().build();
    }


}
