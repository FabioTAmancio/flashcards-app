package com.fabio.flashcards_app.domain.services;

import com.fabio.flashcards_app.data.dto.stats.DailyReviewDTO;
import com.fabio.flashcards_app.data.dto.stats.DeckStatsDTO;
import com.fabio.flashcards_app.data.dto.stats.StatsResponseDTO;
import com.fabio.flashcards_app.data.dto.stats.UserResponseDTO;
import com.fabio.flashcards_app.domain.models.Deck;
import com.fabio.flashcards_app.domain.models.FlashcardProgress;
import com.fabio.flashcards_app.domain.models.User;
import com.fabio.flashcards_app.domain.models.enums.CardStatus;
import com.fabio.flashcards_app.domain.repositories.DeckRepository;
import com.fabio.flashcards_app.domain.repositories.FlashcardProgressRepository;
import com.fabio.flashcards_app.domain.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StatsService {

    @Autowired
    private FlashcardProgressRepository progressRepository;

    @Autowired
    private DeckRepository deckRepository;

    public StatsResponseDTO getStats(User user) {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();

        List<Deck> decks = deckRepository.findByUser(user);
        List<FlashcardProgress> allProgress = progressRepository.findByUser(user);

        int totalDecks = decks.size();
        int totalCards = allProgress.size();

        int cardsDueToday = (int) allProgress.stream()
                .filter(fp -> !fp.getNextReview().isAfter(now))
                .count();

        int cardsReviewedToday = (int) allProgress.stream()
                .filter(fp -> fp.getLastReview() != null
                        && fp.getLastReview().toLocalDate().equals(today))
                .count();

        Map<CardStatus, Long> byStatus = allProgress.stream()
                .collect(Collectors.groupingBy(FlashcardProgress::getStatus, Collectors.counting()));

        int cardsNew      = byStatus.getOrDefault(CardStatus.NEW,      0L).intValue();
        int cardsLearning = byStatus.getOrDefault(CardStatus.LEARNING, 0L).intValue();
        int cardsReview   = byStatus.getOrDefault(CardStatus.REVIEW,   0L).intValue();

        // Streak
        int[] streaks = calculateStreaks(allProgress);
        int currentStreak = streaks[0];
        int longestStreak = streaks[1];

        // Stats per deck
        List<DeckStatsDTO> deckStats = decks.stream().map(deck -> {
            List<FlashcardProgress> dp = allProgress.stream()
                    .filter(fp -> fp.getFlashcard().getDeck().getId().equals(deck.getId()))
                    .toList();

            Map<CardStatus, Long> ds = dp.stream()
                    .collect(Collectors.groupingBy(FlashcardProgress::getStatus, Collectors.counting()));

            int due = (int) dp.stream()
                    .filter(fp -> !fp.getNextReview().isAfter(now))
                    .count();

            return new DeckStatsDTO(
                    deck.getId(),
                    deck.getName(),
                    dp.size(),
                    ds.getOrDefault(CardStatus.NEW,      0L).intValue(),
                    ds.getOrDefault(CardStatus.LEARNING, 0L).intValue(),
                    ds.getOrDefault(CardStatus.REVIEW,   0L).intValue(),
                    due
            );
        }).toList();

        List<DailyReviewDTO> dailyHistory = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        for (int i = 13; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            LocalDateTime from = day.atStartOfDay();
            LocalDateTime to   = day.plusDays(1).atStartOfDay();

            int count = (int) allProgress.stream()
                    .filter(fp -> fp.getLastReview() != null
                            && !fp.getLastReview().isBefore(from)
                            && fp.getLastReview().isBefore(to))
                    .count();

            dailyHistory.add(new DailyReviewDTO(day.format(fmt), count));
        }

        return new StatsResponseDTO(
                totalDecks, totalCards, cardsDueToday, cardsReviewedToday,
                cardsNew, cardsLearning, cardsReview,
                currentStreak, longestStreak,
                deckStats, dailyHistory
        );
    }

    private int[] calculateStreaks(List<FlashcardProgress> allProgress) {
        Set<LocalDate> daysWithReview = allProgress.stream()
                .filter(fp -> fp.getLastReview() != null)
                .map(fp -> fp.getLastReview().toLocalDate())
                .collect(Collectors.toSet());

        LocalDate today = LocalDate.now();
        int current = 0;
        int longest = 0;
        int temp    = 0;

        // Current streak: conta para tras a partir de hoje
        LocalDate cursor = today;
        while (daysWithReview.contains(cursor)) {
            current++;
            cursor = cursor.minusDays(1);
        }

        // Longest streak: percorre todos os dias registrados
        if (!daysWithReview.isEmpty()) {
            LocalDate min = daysWithReview.stream().min(Comparator.naturalOrder()).get();
            cursor = min;
            while (!cursor.isAfter(today)) {
                if (daysWithReview.contains(cursor)) {
                    temp++;
                    longest = Math.max(longest, temp);
                } else {
                    temp = 0;
                }
                cursor = cursor.plusDays(1);
            }
        }

        return new int[]{ current, longest };
    }
}
