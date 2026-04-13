package com.fabio.flashcards_app.domain.repositories;

import com.fabio.flashcards_app.domain.models.FlashcardProgress;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FlashcardProgressRepository extends JpaRepository<FlashcardProgress, Long> {
}
