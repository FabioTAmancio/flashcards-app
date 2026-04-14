package com.fabio.flashcards_app.domain.services;

import com.fabio.flashcards_app.data.dto.flashcard.FlashcardResponseDTO;
import com.fabio.flashcards_app.domain.models.Flashcard;
import com.fabio.flashcards_app.domain.models.FlashcardProgress;
import com.fabio.flashcards_app.domain.models.User;
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

        int repetitions = progress.getRepetitions();
        double easeFactor = progress.getEaseFactor();
        int interval = progress.getInterval();

        // FAIL
        if(quality < 3) {
            repetitions = 0;
            interval = 1;
        } else {
            // SUCESS
            repetitions++;

            if(repetitions == 1) {
                interval = 1;
            } else if (repetitions == 2) {
                interval = 6;
            } else {
                interval = (int) Math.round(interval * easeFactor);
            }
        }

        // Update Ease Factor
        easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

        if(easeFactor > 1.3) {
            easeFactor = 1.3;
        }

        // Next review
        LocalDate nextReview = LocalDate.now().plusDays(interval);

        //save
        progress.setRepetitions(repetitions);
        progress.setEaseFactor(easeFactor);
        progress.setInterval(interval);
        progress.setNextReview(nextReview);

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
