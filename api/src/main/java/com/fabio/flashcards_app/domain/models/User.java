package com.fabio.flashcards_app.domain.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role = "USER"; //USER OR ADMIN for future

    @OneToMany(mappedBy = "user")
    private List<Deck> decks;

    @OneToMany(mappedBy = "user")
    private List<FlashcardProgress> progressList;


}
