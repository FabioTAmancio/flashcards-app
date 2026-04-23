package com.fabio.flashcards_app.domain.models;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "decks")
public class Deck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String description;

    private String color;

    private String subject;

    @Column(name = "is_public")
    private Boolean isPublic = false;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "deck", cascade = CascadeType.ALL)
    private List<Flashcard> flashcards;


}
