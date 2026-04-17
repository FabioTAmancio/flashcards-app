package com.fabio.flashcards_app.domain.repositories;

import com.fabio.flashcards_app.domain.models.Flashcard;
import com.fabio.flashcards_app.domain.models.FlashcardProgress;
import com.fabio.flashcards_app.domain.models.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface FlashcardProgressRepository extends JpaRepository<FlashcardProgress, Long> {

    void deleteByFlashcard(Flashcard flashcard);

    Optional<FlashcardProgress> findByUserIdAndFlashcardId(Long userId, Long flashcardId);

    List<FlashcardProgress> findByUserAndNextReviewLessThanEqual(User user, LocalDateTime date);

    boolean existsByUserAndFlashcard(User user, Flashcard flashcard);
}
