package com.fabio.flashcards_app.domain.services;

import com.fabio.flashcards_app.data.dto.flashcard.FlashcardImportRequestDTO;
import com.fabio.flashcards_app.data.dto.flashcard.FlashcardRequestDTO;
import com.fabio.flashcards_app.data.dto.flashcard.FlashcardResponseDTO;
import com.fabio.flashcards_app.domain.models.Deck;
import com.fabio.flashcards_app.domain.models.Flashcard;
import com.fabio.flashcards_app.domain.models.FlashcardProgress;
import com.fabio.flashcards_app.domain.models.User;
import com.fabio.flashcards_app.domain.models.enums.CardStatus;
import com.fabio.flashcards_app.domain.repositories.DeckRepository;
import com.fabio.flashcards_app.domain.repositories.FlashcardProgressRepository;
import com.fabio.flashcards_app.domain.repositories.FlashcardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FlashcardService {

    @Autowired
    private FlashcardRepository flashcardRepository;

    @Autowired
    private DeckRepository deckRepository;

    @Autowired
    private FlashcardProgressRepository progressRepository;

    //create flashcard
    public FlashcardResponseDTO create(Long deckId, FlashcardRequestDTO dto, User user) {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new RuntimeException("Deck not found"));

        if(!deck.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Deck doesn't belong to user");
        }

        Flashcard flashcard = new Flashcard();
        flashcard.setFront(dto.front());
        flashcard.setBack(dto.back());
        flashcard.setSubject(dto.subject());
        flashcard.setDeck(deck);
        flashcard.setUser(user);

        flashcardRepository.save(flashcard);

        FlashcardProgress progress = new FlashcardProgress();
        progress.setUser(user);
        progress.setFlashcard(flashcard);
        progress.setInterval(1);
        progress.setEaseFactor(2.5);
        progress.setRepetitions(0);
        progress.setNextReview(LocalDateTime.now());
        progress.setStatus(CardStatus.NEW);
        progress.setLastReview(null);

        progressRepository.save(progress);

        return toDTO(flashcard);
    }

    //create a list of flashcards by import
    public void importFlashcards(Long deckId, List<FlashcardImportRequestDTO> dtos, User user) {

        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new RuntimeException("Deck not found"));

        List<Flashcard> flashcards = dtos.stream().map(dto -> {
            Flashcard f = new Flashcard();
            f.setFront(dto.front());
            f.setBack(dto.back());
            f.setSubject(dto.subject());
            f.setDeck(deck);
            f.setUser(user);
            return f;
        }).toList();

        flashcardRepository.saveAll(flashcards);

        for(Flashcard f : flashcards) {
            FlashcardProgress p = new FlashcardProgress();
            p.setFlashcard(f);
            p.setUser(user);
            p.setStatus(CardStatus.NEW);
            p.setNextReview(LocalDateTime.now());

            progressRepository.save(p);
        }
    }

    //list by deck
    public List<FlashcardResponseDTO> getByDeck(Long deckId, User user) {
        return flashcardRepository.findByUserAndDeckId(user, deckId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    //get by id
    public FlashcardResponseDTO getById(Long id, User user) {
        Flashcard f = flashcardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Flashcard not found"));

        validateOwnership(f, user);

        return toDTO(f);
    }

    //update all entity
    public FlashcardResponseDTO update(Long id, FlashcardRequestDTO dto, User user) {
        Flashcard f = flashcardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Flashcard not found"));

        validateOwnership(f, user);

        f.setFront(dto.front());
        f.setBack(dto.back());
        f.setSubject(dto.subject());

        flashcardRepository.save(f);

        return toDTO(f);
    }

    //delete
    public void delete(Long id, User user) {
        Flashcard f = flashcardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Flashcard not found"));

        validateOwnership(f, user);

        progressRepository.deleteByFlashcard(f);
        flashcardRepository.delete(f);
    }

    // VALIDATION
    private void validateOwnership(Flashcard f, User user) {
        if (!f.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Flashcard doesn't belong to user");
        }
    }

    // DTO
    public FlashcardResponseDTO toDTO(Flashcard f) {
        return new FlashcardResponseDTO(
                f.getId(),
                f.getFront(),
                f.getBack(),
                f.getSubject(),
                f.getDeck().getId()
        );
    }
}
