package com.fabio.flashcards_app.data.dto.stats;

import java.util.List;

public record StatsResponseDTO(
        int totalDecks,
        int totalCards,
        int cardsDueToday,
        int cardsReviewedToday,

        int cardsNew,
        int cardsLearning,
        int cardsReview,

        int currentStreak,
        int longestStreak,

        List<DeckStatsDTO> deckStats,

        List<DailyReviewDTO> dailyHistory
) {
}
