package com.fabio.flashcards_app.domain.services;

import com.fabio.flashcards_app.data.dto.flashcard.FlashcardResponseDTO;
import com.fabio.flashcards_app.domain.models.Flashcard;
import com.fabio.flashcards_app.domain.models.FlashcardProgress;
import com.fabio.flashcards_app.domain.models.User;
import com.fabio.flashcards_app.domain.models.enums.CardStatus;
import com.fabio.flashcards_app.domain.repositories.FlashcardProgressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReviewService {

    @Autowired
    private FlashcardProgressRepository progressRepository;

    @Autowired
    private FlashcardService flashcardService;

    public void reviewFlashcard(Long flashcardId, User user, int quality) {

        FlashcardProgress progress = progressRepository.findByUserIdAndFlashcardId(user.getId(), flashcardId)
                .orElseThrow(() -> new RuntimeException("Progress not found!"));

        LocalDateTime now = LocalDateTime.now();

        int repetitions = progress.getRepetitions();
        double easeFactor = progress.getEaseFactor();
        int interval = progress.getInterval();
        CardStatus status = progress.getStatus();

        // NEW -> turn LEARNING
        if(status == CardStatus.NEW) {
            progress.setStatus(CardStatus.NEW);
            progress.setNextReview(now.plusMinutes(5));
            progress.setLastReview(now);

            progressRepository.save(progress);
            return;
        }

        // LEARNING
        if(status == CardStatus.LEARNING) {
            if(quality < 3) {
                //fail -> return to start point of learn
                progress.setNextReview(now.plusMinutes(5));
            } else {
                // correct -> turn REVIEW
                progress.setStatus(CardStatus.REVIEW);
                progress.setRepetitions(1);
                progress.setInterval(1);
                progress.setNextReview(now.plusDays(1));
            }

            progress.setLastReview(now);
            progressRepository.save(progress);
            return;
        }

        // REVIEW (SM-2)
        if(status == CardStatus.REVIEW) {

            if(quality < 3) {
                // fail -> return to LEARNING
                progress.setStatus(CardStatus.LEARNING);
                progress.setRepetitions(0);
                progress.setInterval(1);
                progress.setNextReview(now.plusMinutes(10));
            } else {

                repetitions++;

                if(repetitions == 1) {
                    interval = 1;
                } else if(repetitions == 2) {
                    interval = 6;
                } else {
                    interval = (int) Math.round(interval * easeFactor);
                }

                // adjust ease factor (SM-2)
                easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 * (5 - quality) * 0.02));

                if(easeFactor < 1.3) {
                    easeFactor = 1.3;
                }

                // bonus if answer correct easily
                if(quality == 5) {
                    interval = (int) Math.round(interval * 1.3);
                }

                progress.setNextReview(now.plusDays(interval));
            }
        }

        progress.setRepetitions(repetitions);
        progress.setEaseFactor(easeFactor);
        progress.setInterval(interval);
        progress.setLastReview(now);

        progressRepository.save(progress);
    }

    public List<FlashcardResponseDTO> getDueFlashcards(User user) {
        List<FlashcardResponseDTO> dueFlashcards = new ArrayList<>();
        List<Flashcard> f = progressRepository
                .findByUserAndNextReviewLessThanEqual(user, LocalDateTime.now())
                .stream()
                .map(FlashcardProgress::getFlashcard)
                .toList();
        for(Flashcard flashcard : f) {
            dueFlashcards.add(flashcardService.toDTO(flashcard));
        }

        return dueFlashcards;
    }


}
