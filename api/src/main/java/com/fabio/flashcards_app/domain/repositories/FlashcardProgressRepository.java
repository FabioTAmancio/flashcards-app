package com.fabio.flashcards_app.domain.repositories;

import com.fabio.flashcards_app.domain.models.FlashcardProgress;
import com.fabio.flashcards_app.domain.models.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface FlashcardProgressRepository extends JpaRepository<FlashcardProgress, Long> {

    Optional<FlashcardProgress> findByUserIdAndFlashcardId(Long userId, Long flashcardId);

    List<FlashcardProgress> findByUserAndNextReviewLessThanEqual(User user, LocalDateTime date);
}
