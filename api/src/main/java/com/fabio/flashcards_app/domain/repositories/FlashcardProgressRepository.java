package com.fabio.flashcards_app.domain.repositories;

import com.fabio.flashcards_app.domain.models.Flashcard;
import com.fabio.flashcards_app.domain.models.FlashcardProgress;
import com.fabio.flashcards_app.domain.models.User;
import com.fabio.flashcards_app.domain.models.enums.CardStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface FlashcardProgressRepository extends JpaRepository<FlashcardProgress, Long> {

    void deleteByFlashcard(Flashcard flashcard);

    Optional<FlashcardProgress> findByUserIdAndFlashcardId(Long userId, Long flashcardId);

    List<FlashcardProgress> findByUserAndNextReviewLessThanEqual(User user, LocalDateTime date);

    boolean existsByUserAndFlashcard(User user, Flashcard flashcard);

    List<FlashcardProgress> findByUser(User user);

    @Query("""
        SELECT fp FROM FlashcardProgress fp
        WHERE fp.user = :user
          AND fp.nextReview <= :now
          AND fp.flashcard.deck.reviewEnabled = true
    """)
    List<FlashcardProgress> findDueForUser(
            @Param("user") User user,
            @Param("now") LocalDateTime now
    );

    @Query("""
        SELECT fp FROM FlashcardProgress fp
        WHERE fp.user = :user
          AND fp.nextReview <= :now
          AND fp.flashcard.deck.id = :deckId
          AND fp.flashcard.deck.reviewEnabled = true
    """)
    List<FlashcardProgress> findDueForUserAndDeck(
            @Param("user") User user,
            @Param("now") LocalDateTime now,
            @Param("deckId") Long deckId
    );

    long countByUserAndStatus(User user, CardStatus status);

    long countByUserAndNextReviewLessThanEqual(User user, LocalDateTime date);

    // Last Review not null
    @Query("""
        SELECT fp FROM FlashcardProgress fp
        WHERE fp.user = :user
          AND fp.lastReview >= :from
          AND fp.lastReview < :to
    """)
    List<FlashcardProgress> findReviewedBetween(
            @Param("user") User user,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    // Specific Deck progress
    @Query("""
        SELECT fp FROM FlashcardProgress fp
        WHERE fp.user = :user
          AND fp.flashcard.deck.id = :deckId
    """)
    List<FlashcardProgress> findByUserAndDeckId(
            @Param("user") User user,
            @Param("deckId") Long deckId
    );
}
