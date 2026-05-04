package com.fabio.flashcards_app.domain.repositories;

import com.fabio.flashcards_app.domain.models.Folder;
import com.fabio.flashcards_app.domain.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface FolderRepository extends JpaRepository<Folder, Long> {

    List<Folder> findByUserAndParentIsNull(User user);

    List<Folder> findByUser(User user);

    @Query("""
    SELECT f FROM Folder f
    LEFT JOIN FETCH f.children
    WHERE f.user = :user AND f.parent IS NULL
    """)
    List<Folder> findRootsWithChildren(User user);
}
