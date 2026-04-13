package com.fabio.flashcards_app.domain.models;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "flashcard_progress")
public class FlashcardProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private User user;

    @ManyToOne(optional = false)
    private Flashcard flashcard;

    private Integer interval = 1;

    private Double easeFactor = 2.5;

    private Integer repetitions = 0;

    private LocalDate nextReview = LocalDate.now();
}
