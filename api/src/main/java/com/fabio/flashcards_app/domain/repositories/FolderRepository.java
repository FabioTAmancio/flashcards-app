package com.fabio.flashcards_app.domain.repositories;

import com.fabio.flashcards_app.domain.models.Folder;
import com.fabio.flashcards_app.domain.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FolderRepository extends JpaRepository<Folder, Long> {

    List<Folder> findByUserAndParentIsNull(User user);

    List<Folder> findByUser(User user);

    @Query("SELECT f.id FROM Folder f WHERE f.user = :user")
    List<Long> findAllIdsByUser(@Param("user") User user);

    @Query("""
    SELECT DISTINCT f FROM Folder f
    LEFT JOIN FETCH f.children c
    LEFT JOIN FETCH f.decks d
    WHERE f.user = :user AND f.parent IS NULL
    """)
    List<Folder> findRootsWithChildren(User user);

    @Query("""
    SELECT DISTINCT f FROM Folder f
    LEFT JOIN FETCH f.decks
    WHERE f.user = :user
    """)
    List<Folder> findAllWithDecks(User user);

    @Modifying
    @Query("UPDATE Folder f SET f.reviewEnabled = :state WHERE f.parent.id IN :parentIds")
    void updateReviewEnabledByParentIds(@Param("parentIds") List<Long> parentIds,
                                        @Param("state") boolean state);
}
