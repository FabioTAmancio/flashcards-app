package com.fabio.flashcards_app.domain.services;

import com.fabio.flashcards_app.data.dto.deck.DeckRequestDTO;
import com.fabio.flashcards_app.data.dto.deck.DeckResponseDTO;
import com.fabio.flashcards_app.domain.models.Deck;
import com.fabio.flashcards_app.domain.models.Folder;
import com.fabio.flashcards_app.domain.models.User;
import com.fabio.flashcards_app.domain.repositories.DeckRepository;
import com.fabio.flashcards_app.domain.repositories.FolderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DeckService {

    @Autowired
    private DeckRepository deckRepository;
    @Autowired
    private FolderRepository folderRepository;

    public DeckResponseDTO createDeck(User user, DeckRequestDTO dto) {
        Deck deck = new Deck();
        deck.setName(dto.name());
        deck.setDescription(dto.description());
        deck.setColor(dto.color());
        deck.setSubject(dto.subject());
        deck.setIsPublic(dto.isPublic() != null ? dto.isPublic() : false);
        deck.setReviewEnabled(dto.reviewEnabled() != null ? dto.reviewEnabled() : true);
        deck.setUser(user);
        deck.setFolder(resolveFolder(dto.folderId(), user));
        deckRepository.save(deck);
        return toDTO(deck);
    }

    @Transactional
    public List<DeckResponseDTO> getUserDecks(User user) {
        return deckRepository.findDecksWithCount(user);
    }

    public DeckResponseDTO getDeckById(Long id, User user) {
        Deck deck = findAndValidate(id, user);
        return toDTO(deck);
    }

    public DeckResponseDTO updateDeck(Long id, DeckRequestDTO dto, User user) {
        Deck deck = findAndValidate(id, user);

        deck.setName(dto.name());
        deck.setDescription(dto.description());
        deck.setColor(dto.color());
        deck.setSubject(dto.subject());
        deck.setIsPublic(dto.isPublic() != null ? dto.isPublic() : false);
        if (dto.reviewEnabled() != null) deck.setReviewEnabled(dto.reviewEnabled());
        if(dto.folderId() != null || dto.folderId() == null)
            deck.setFolder(resolveFolder(dto.folderId(), user));

        deckRepository.save(deck);

        return toDTO(deck);
    }

    // PATCH /deck/{id}/toggle-review = on/off deck to review
    public DeckResponseDTO toggleReview(Long id, User user) {
        Deck deck = findAndValidate(id, user);
        deck.setReviewEnabled(!Boolean.TRUE.equals(deck.getReviewEnabled()));
        deckRepository.save(deck);
        return toDTO(deck);
    }

    public void deleteDeck(Long id, User user) {
        Deck deck = deckRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Deck not found"));

        if(!deck.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Deck is not owner of user");
        }

        deckRepository.delete(deck);
    }

    // Ajudadores
    private Deck findAndValidate(Long id, User user) {
        Deck deck = deckRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Deck not found"));
        if(!deck.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Deck is not owner of user");
        }
        return deck;
    }

    private Folder resolveFolder(Long folderId, User user) {
        if(folderId == null) {
            return null;
        }
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Folder not found"));
        if(!folder.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Folder is not owner of user");
        }
        return folder;
    }

    public DeckResponseDTO toDTO(Deck deck) {
        return new DeckResponseDTO(
                deck.getId(),
                deck.getName(),
                deck.getDescription(),
                deck.getColor(),
                deck.getSubject(),
                deck.getIsPublic(),
                Boolean.TRUE.equals(deck.getReviewEnabled()),
                0L,
                deck.getFolder() != null ? deck.getFolder().getId() : null
        );
    }

}