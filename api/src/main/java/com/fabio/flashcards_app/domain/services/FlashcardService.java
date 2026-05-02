package com.fabio.flashcards_app.domain.services;

import com.fabio.flashcards_app.data.dto.flashcard.*;
import com.fabio.flashcards_app.data.dto.imports.FlashcardImportDTO;
import com.fabio.flashcards_app.data.dto.imports.FlashcardImportItemDTO;
import com.fabio.flashcards_app.data.dto.imports.FlashcardImportResultDTO;
import com.fabio.flashcards_app.domain.models.Deck;
import com.fabio.flashcards_app.domain.models.Flashcard;
import com.fabio.flashcards_app.domain.models.FlashcardProgress;
import com.fabio.flashcards_app.domain.models.User;
import com.fabio.flashcards_app.domain.models.enums.CardStatus;
import com.fabio.flashcards_app.domain.models.enums.CardType;
import com.fabio.flashcards_app.domain.repositories.DeckRepository;
import com.fabio.flashcards_app.domain.repositories.FlashcardProgressRepository;
import com.fabio.flashcards_app.domain.repositories.FlashcardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class FlashcardService {

    @Autowired private FlashcardRepository flashcardRepository;
    @Autowired private DeckRepository deckRepository;
    @Autowired private FlashcardProgressRepository progressRepository;
    @Autowired private CloudinaryService cloudinaryService;

    public FlashcardResponseDTO create(Long deckId, FlashcardRequestDTO dto, User user) {
        Deck deck = findDeckAndValidate(deckId, user);
        Flashcard flashcard = buildAndSave(dto, deck, user);
        createProgressIfAbsent(user, flashcard);
        return toDTO(flashcard);
    }

    @Transactional
    public FlashcardImportResultDTO importCards(FlashcardImportDTO dto, User user) {
        Deck deck = findDeckAndValidate(dto.deckId(), user);
        int imported = 0, skipped = 0;
        List<String> errors = new ArrayList<>();

        for (int i = 0; i < dto.cards().size(); i++) {
            FlashcardImportItemDTO item = dto.cards().get(i);
            try {
                if (isBlank(item.front()) || isBlank(item.back())) {
                    skipped++;
                    errors.add("Linha %d: 'front' e 'back' são obrigatórios.".formatted(i + 1));
                    continue;
                }
                String subject = isBlank(item.subject()) ? deck.getName() : item.subject();
                FlashcardRequestDTO req = new FlashcardRequestDTO(
                        item.front(), item.back(), subject, dto.deckId(), null, null, "BASIC"
                );
                Flashcard f = buildAndSave(req, deck, user);
                createProgressIfAbsent(user, f);
                imported++;
            } catch (Exception e) {
                skipped++;
                errors.add("Linha %d: %s".formatted(i + 1, e.getMessage()));
            }
        }
        return new FlashcardImportResultDTO(imported, skipped, errors);
    }

    public List<FlashcardResponseDTO> getByDeck(Long deckId, User user) {
        return flashcardRepository.findByUserAndDeckId(user, deckId)
                .stream().map(this::toDTO).toList();
    }

    public FlashcardResponseDTO getById(Long id, User user) {
        Flashcard f = findAndValidate(id, user);
        return toDTO(f);
    }

    public FlashcardResponseDTO update(Long id, FlashcardRequestDTO dto, User user) {
        Flashcard f = findAndValidate(id, user);
        f.setFront(dto.front());
        f.setBack(dto.back());
        f.setSubject(dto.subject());
        if (dto.frontImageUrl() != null) f.setFrontImageUrl(dto.frontImageUrl());
        if (dto.backImageUrl() != null)  f.setBackImageUrl(dto.backImageUrl());
        if (dto.cardType() != null) {
            try { f.setCardType(CardType.valueOf(dto.cardType())); }
            catch (IllegalArgumentException ignored) {}
        }
        flashcardRepository.save(f);
        return toDTO(f);
    }

    public void delete(Long id, User user) {
        Flashcard f = findAndValidate(id, user);
        cloudinaryService.delete(f.getFrontImageUrl());
        cloudinaryService.delete(f.getBackImageUrl());
        progressRepository.deleteByFlashcard(f);
        flashcardRepository.delete(f);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Deck findDeckAndValidate(Long deckId, User user) {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new RuntimeException("Deck not found"));
        if (!deck.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Deck doesn't belong to user");
        return deck;
    }

    private Flashcard findAndValidate(Long id, User user) {
        Flashcard f = flashcardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Flashcard not found"));
        if (!f.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Flashcard doesn't belong to user");
        return f;
    }

    private Flashcard buildAndSave(FlashcardRequestDTO dto, Deck deck, User user) {
        Flashcard f = new Flashcard();
        f.setFront(dto.front().trim());
        f.setBack(dto.back().trim());
        f.setSubject(dto.subject().trim());
        f.setDeck(deck);
        f.setUser(user);
        f.setFrontImageUrl(dto.frontImageUrl());
        f.setBackImageUrl(dto.backImageUrl());

        CardType type = CardType.BASIC;
        if (dto.cardType() != null) {
            try { type = CardType.valueOf(dto.cardType()); }
            catch (IllegalArgumentException ignored) {}
        }
        f.setCardType(type);

        return flashcardRepository.save(f);
    }

    private void createProgressIfAbsent(User user, Flashcard flashcard) {
        if (!progressRepository.existsByUserAndFlashcard(user, flashcard)) {
            FlashcardProgress p = new FlashcardProgress();
            p.setUser(user);
            p.setFlashcard(flashcard);
            p.setInterval(1);
            p.setEaseFactor(2.5);
            p.setRepetitions(0);
            p.setNextReview(LocalDateTime.now());
            p.setStatus(CardStatus.NEW);
            progressRepository.save(p);
        }
    }

    public FlashcardResponseDTO toDTO(Flashcard f) {
        return new FlashcardResponseDTO(
                f.getId(), f.getFront(), f.getBack(), f.getSubject(),
                f.getDeck().getId(), f.getFrontImageUrl(), f.getBackImageUrl(),
                f.getCardType().name()
        );
    }

    private static boolean isBlank(String s) { return s == null || s.isBlank(); }
}
