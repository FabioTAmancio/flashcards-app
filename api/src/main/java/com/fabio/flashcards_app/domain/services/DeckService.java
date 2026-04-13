package com.fabio.flashcards_app.domain.services;

import com.fabio.flashcards_app.data.dto.deck.DeckRequestDTO;
import com.fabio.flashcards_app.data.dto.deck.DeckResponseDTO;
import com.fabio.flashcards_app.domain.models.Deck;
import com.fabio.flashcards_app.domain.models.User;
import com.fabio.flashcards_app.domain.repositories.DeckRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DeckService {

    @Autowired
    private DeckRepository deckRepository;

    public DeckResponseDTO createDeck(User user, DeckRequestDTO dto) {
        Deck deck = new Deck();
        deck.setName(dto.name());
        deck.setDescription(dto.description());
        deck.setColor(dto.color());
        deck.setSubject(dto.subject());
        deck.setIsPublic(dto.isPublic() != null ? dto.isPublic() : false);
        deck.setUser(user);

        deckRepository.save(deck);

        return toDTO(deck);
    }

    public List<DeckResponseDTO> getUserDecks(User user) {
        return deckRepository.findByUser(user)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public DeckResponseDTO getDeckById(Long id, User user) {
        Deck deck = deckRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Deck not found"));

        if(!deck.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Deck is not owner of user");
        }

        return toDTO(deck);
    }

    public DeckResponseDTO updateDeck(Long id, DeckRequestDTO dto, User user) {
        Deck deck = deckRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Deck not found"));

        if(!deck.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Deck is not owner of user");
        }

        deck.setName(dto.name());
        deck.setDescription(dto.description());
        deck.setColor(dto.color());
        deck.setSubject(dto.subject());
        deck.setIsPublic(dto.isPublic());

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

    private DeckResponseDTO toDTO(Deck deck) {
        return new DeckResponseDTO(
                deck.getId(),
                deck.getName(),
                deck.getDescription(),
                deck.getColor(),
                deck.getSubject(),
                deck.getIsPublic()
        );
    }

}
