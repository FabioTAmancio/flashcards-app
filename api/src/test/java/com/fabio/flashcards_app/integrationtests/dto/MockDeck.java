package com.fabio.flashcards_app.integrationtests.dto;


import com.fabio.flashcards_app.domain.models.Flashcard;
import com.fabio.flashcards_app.domain.models.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class MockDeck {



    private Long id;
    private String name;
    private String description;
    private String color;
    private String subject;
    private Boolean isPublic;
    private User user;
    private List<Flashcard> flashcards;

    public MockDeck() {
        this.id = 1L;
        this.name = "Mock Deck";
        this.description = "Description test";
        this.color = "red";
        this.subject = "Subject";
        this.isPublic = true;
        this.user = new User(); // After change to a mockUser
        this.flashcards = new ArrayList<>();
    }

}