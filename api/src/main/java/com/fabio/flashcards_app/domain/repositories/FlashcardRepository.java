package com.fabio.flashcards_app.domain.repositories;

import com.fabio.flashcards_app.domain.models.Flashcard;
import com.fabio.flashcards_app.domain.models.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {
    List<Flashcard> findByUser(User user);

    List<Flashcard> findByDeckId(Long deckId);

    List<Flashcard> findByUserAndDeckId(User user, Long deckId);
}
