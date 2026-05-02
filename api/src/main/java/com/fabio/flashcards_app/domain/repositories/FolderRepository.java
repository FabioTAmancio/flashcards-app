package com.fabio.flashcards_app.domain.repositories;

import com.fabio.flashcards_app.domain.models.Folder;
import com.fabio.flashcards_app.domain.models.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FolderRepository extends JpaRepository<Folder, Long> {

    List<Folder> findByUserAndParentIsNull(User user);

    List<Folder> findByUser(User user);
}
