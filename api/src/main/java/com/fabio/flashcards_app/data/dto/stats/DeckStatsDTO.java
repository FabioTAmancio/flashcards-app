package com.fabio.flashcards_app.data.dto.stats;

public record DeckStatsDTO(
        Long deckId,
        String deckName,
        int totalCards,
        int cardsNew,
        int cardsLearning,
        int cardsReview,
        int cardsDue
) {
}
