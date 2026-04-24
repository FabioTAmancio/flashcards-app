package com.fabio.flashcards_app.web.controllers;

import com.fabio.flashcards_app.data.dto.flashcard.FlashcardResponseDTO;
import com.fabio.flashcards_app.data.dto.review.ReviewRequestDTO;
import com.fabio.flashcards_app.domain.models.User;
import com.fabio.flashcards_app.domain.services.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/review")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;


    @GetMapping("/due")
    public ResponseEntity<List<FlashcardResponseDTO>> getDue(
            @RequestParam(required = false) Long deckId,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(reviewService.getDueFlashcards(user, deckId));
    }

    @PostMapping("/{flashcardId}")
    public ResponseEntity<Void> review(
            @PathVariable Long flashcardId,
            @RequestBody ReviewRequestDTO dto,
            @AuthenticationPrincipal User user
    ) {
        reviewService.reviewFlashcard(flashcardId, user, dto.quality());
        return ResponseEntity.ok().build();
    }

}
