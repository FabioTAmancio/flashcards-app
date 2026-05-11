package com.fabio.flashcards_app.domain.services;

import com.fabio.flashcards_app.data.dto.Folder.FolderRequestDTO;
import com.fabio.flashcards_app.data.dto.Folder.FolderResponseDTO;
import com.fabio.flashcards_app.data.dto.deck.DeckResponseDTO;
import com.fabio.flashcards_app.domain.models.Deck;
import com.fabio.flashcards_app.domain.models.Folder;
import com.fabio.flashcards_app.domain.models.User;
import com.fabio.flashcards_app.domain.repositories.DeckRepository;
import com.fabio.flashcards_app.domain.repositories.FolderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FolderService {

    @Autowired private FolderRepository folderRepository;
    @Autowired private DeckRepository deckRepository;
    @Autowired private DeckService deckService;

    public FolderResponseDTO create(FolderRequestDTO dto, User user) {
        Folder folder = new Folder();
        folder.setName(dto.name());
        folder.setUser(user);

        if(dto.parentId() != null) {
            Folder parent = findAndValidate(dto.parentId(), user);
            validateDepth(parent, user);
            folder.setParent(parent);
        }

        folderRepository.save(folder);
        return toDTO(folder);
    }

    @Transactional(readOnly = true)
    public List<FolderResponseDTO> getTree(User user) {
        // Busca TODAS as pastas com decks em 1 query
        List<Folder> allFolders = folderRepository.findAllWithDecks(user);

        // Count de cards em 1 query
        Map<Long, Long> deckCountMap = deckRepository.findDecksWithCount(user)
                .stream()
                .collect(Collectors.toMap(DeckResponseDTO::id, DeckResponseDTO::cardCount));

        // Monta a árvore em memória sem mais queries
        Map<Long, Folder> byId = allFolders.stream()
                .collect(Collectors.toMap(Folder::getId, f -> f));

        return allFolders.stream()
                .filter(f -> f.getParent() == null)
                .map(f -> toDTOWithChildren(f, deckCountMap))
                .toList();
    }

    public FolderResponseDTO rename(Long id, String name, User user) {
        Folder folder = findAndValidate(id, user);
        folder.setName(name);
        folderRepository.save(folder);
        return toDTO(folder);
    }

    public FolderResponseDTO move(Long id, Long newParentId, User user) {
        Folder folder = findAndValidate(id, user);

        if(newParentId == null) {
            folder.setParent(null);
        } else {
            Folder newParent = findAndValidate(newParentId, user);
            if(isDescendant(folder, newParent)) {
                throw new RuntimeException("Not possible to move a folder inside itself");
            }
            validateDepth(newParent, user);
            folder.setParent(newParent);
        }
        folderRepository.save(folder);
        return toDTO(folder);
    }

    @Transactional
    public FolderResponseDTO toggleReview(Long id, User user) {
        Folder folder = findAndValidate(id, user);
        boolean newState = !Boolean.TRUE.equals(folder.getReviewEnabled());
        folder.setReviewEnabled(newState);
        folderRepository.save(folder);

        List<Long> descendantFolderIds = collectDescendantIds(folder);
        if (!descendantFolderIds.isEmpty()) {
            folderRepository.updateReviewEnabledByParentIds(descendantFolderIds, newState);
            deckRepository.updateReviewEnabledByFolderIds(descendantFolderIds, newState);
        }
        deckRepository.updateReviewEnabledByFolderIds(List.of(id), newState);

        // Retorna DTO simples sem carregar filhos/flashcards
        return toDTO(folder);
    }

    public DeckResponseDTO moveDeckToFolder(Long deckId, Long folderId, User user) {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new RuntimeException("Deck not found"));
        if(!deck.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Deck not belong this user");

        if(folderId == null) {
            deck.setFolder(null);
        } else {
            Folder folder = findAndValidate(folderId, user);
            deck.setFolder(folder);
        }
        deckRepository.save(deck);
        return deckService.toDTO(deck);
    }

    public void delete(Long id, User user) {
        Folder folder = findAndValidate(id, user);
        folderRepository.delete(folder);
    }

    // HELPERS

    private void propagateReviewToDecks(Folder folder, boolean newState) {
        if(folder.getDecks() == null) return;
        for(Deck deck : folder.getDecks()) {
            deck.setReviewEnabled(newState);
            deckRepository.save(deck);
        }
    }

    private void propagateReviewToSubFolders(Folder folder, boolean newState) {
        if(folder.getChildren() == null) return;
        for(Folder child : folder.getChildren()) {
            child.setReviewEnabled(newState);
            folderRepository.save(child);
            propagateReviewToDecks(child, newState);
            propagateReviewToSubFolders(child, newState);
        }
    }

    private Folder findAndValidate(Long id, User user) {
        Folder folder = folderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Folder not found"));
        if(!folder.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Folder not belong this user");
        return folder;
    }

    private boolean isDescendant(Folder folder, Folder candidate) {
        Folder current = candidate;
        while(current != null) {
            if(current.getId().equals(folder.getId())) return true;
            current = current.getParent();
        }
        return false;
    }

    private void validateDepth(Folder parent, User user) {
        int depth = 0;
        Folder current = parent;
        while(current != null) {
            depth++;
            if(depth >= 5) throw new RuntimeException("Max depth exceeded");
            current = current.getParent();
        }
    }

    private List<Long> collectDescendantIds(Folder folder) {
        List<Long> ids = new ArrayList<>();
        if (folder.getChildren() == null) return ids;
        for (Folder child : folder.getChildren()) {
            ids.add(child.getId());
            ids.addAll(collectDescendantIds(child));
        }
        return ids;
    }

    private FolderResponseDTO toDTOWithChildren(Folder folder, Map<Long, Long> deckCountMap) {
        List<FolderResponseDTO> children = folder.getChildren() != null
                ? folder.getChildren().stream()
                .map(c -> toDTOWithChildren(c, deckCountMap))
                .toList()
                : List.of();

        List<DeckResponseDTO> decks = folder.getDecks() != null
                ? folder.getDecks().stream()
                .map(deck -> new DeckResponseDTO(
                        deck.getId(),
                        deck.getName(),
                        deck.getDescription(),
                        deck.getColor(),
                        deck.getSubject(),
                        deck.getIsPublic(),
                        Boolean.TRUE.equals(deck.getReviewEnabled()),
                        deckCountMap.getOrDefault(deck.getId(), 0L), // count sem lazy load
                        folder.getId()
                ))
                .toList()
                : List.of();

        return new FolderResponseDTO(
                folder.getId(),
                folder.getName(),
                folder.getParent() != null ? folder.getParent().getId() : null,
                Boolean.TRUE.equals(folder.getReviewEnabled()),
                children,
                decks
        );
    }

    public FolderResponseDTO toDTO(Folder folder) {
        return new FolderResponseDTO(
                folder.getId(),
                folder.getName(),
                folder.getParent() != null ? folder.getParent().getId() : null,
                Boolean.TRUE.equals(folder.getReviewEnabled()),
                List.of(),
                List.of()
        );
    }
}
