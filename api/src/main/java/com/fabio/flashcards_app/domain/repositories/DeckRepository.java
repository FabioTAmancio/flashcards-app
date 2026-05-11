package com.fabio.flashcards_app.domain.repositories;

import com.fabio.flashcards_app.data.dto.deck.DeckResponseDTO;
import com.fabio.flashcards_app.domain.models.Deck;
import com.fabio.flashcards_app.domain.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DeckRepository extends JpaRepository<Deck, Long> {

    List<Deck> findByUser(User user);

    @Query(value = """
    SELECT new com.fabio.flashcards_app.data.dto.deck.DeckResponseDTO(
        d.id,
        d.name,
        d.description,
        d.color,
        d.subject,
        d.isPublic,
        d.reviewEnabled,
        COUNT(f),
        d.folder.id
    )
    FROM Deck d
    LEFT JOIN d.flashcards f
    WHERE d.user = :user
    GROUP BY d
""")
    List<DeckResponseDTO> findDecksWithCount(User user);

    @Modifying
    @Query("UPDATE Deck d SET d.reviewEnabled = :state WHERE d.folder.id IN :folderIds")
    void updateReviewEnabledByFolderIds(@Param("folderIds") List<Long> folderIds,
                                        @Param("state") boolean state);
}
