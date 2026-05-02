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

import java.util.List;

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

    public List<FolderResponseDTO> getTree(User user) {
        List<Folder> roots = folderRepository.findByUserAndParentIsNull(user);
        return roots.stream().map(f -> toDTOWithChildren(f, user)).toList();
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

    private FolderResponseDTO toDTOWithChildren(Folder folder, User user) {
        List<FolderResponseDTO> children = folder.getChildren() != null
                ? folder.getChildren().stream()
                .map(c -> toDTOWithChildren(c, user))
                .toList()
                : List.of();

        List<DeckResponseDTO> decks = folder.getDecks() != null
                ? folder.getDecks().stream()
                .map(deckService::toDTO)
                .toList()
                : List.of();

        return new FolderResponseDTO(
                folder.getId(),
                folder.getName(),
                folder.getParent() != null ? folder.getParent().getId() : null,
                children,
                decks
        );
    }

    public FolderResponseDTO toDTO(Folder folder) {
        return new FolderResponseDTO(
                folder.getId(),
                folder.getName(),
                folder.getParent() != null ? folder.getParent().getId() : null,
                List.of(),
                List.of()
        );
    }

}
