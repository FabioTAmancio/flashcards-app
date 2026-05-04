package com.fabio.flashcards_app.domain.services;

import com.fabio.flashcards_app.data.dto.User.ProfileResponseDTO;
import com.fabio.flashcards_app.data.dto.User.ProfileUpdateDTO;
import com.fabio.flashcards_app.domain.models.User;
import com.fabio.flashcards_app.domain.models.enums.UserPlan;
import com.fabio.flashcards_app.domain.repositories.DeckRepository;
import com.fabio.flashcards_app.domain.repositories.FlashcardProgressRepository;
import com.fabio.flashcards_app.domain.repositories.FlashcardRepository;
import com.fabio.flashcards_app.domain.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ProfileService {

    @Autowired private UserRepository userRepository;
    @Autowired private DeckRepository deckRepository;
    @Autowired private FlashcardRepository flashcardRepository;
    @Autowired private FlashcardProgressRepository progressRepository;
    @Autowired private CloudinaryService cloudinaryService;

    public ProfileResponseDTO getProfile(User user) {
        int totalDecks = deckRepository.findByUser(user).size();
        int totalCards = flashcardRepository.findByUser(user).size();
        int streak = calculateStreak(user);

        return new ProfileResponseDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getAvatarUrl(),
                user.getPlan(),
                user.getEmailVerified(),
                totalDecks,
                totalCards,
                streak
        );
    }

    public ProfileResponseDTO uploadAvatar(MultipartFile file, User user) throws Exception {
        String url = cloudinaryService.upload(file);
        user.setAvatarUrl(url);
        userRepository.save(user);
        return getProfile(user);
    }

    public ProfileResponseDTO upgradeToPremium(User user) {
        user.setPlan(UserPlan.PREMIUM.name());
        userRepository.save(user);
        return getProfile(user);
    }

    public ProfileResponseDTO downgradeToFree(User user) {
        user.setPlan(UserPlan.FREE.name());
        userRepository.save(user);
        return getProfile(user);
    }

    public ProfileResponseDTO updateProfile(ProfileUpdateDTO dto, User user) {
        if (dto.name() != null && !dto.name().isBlank())
            user.setName(dto.name().trim());
        if (dto.avatarUrl() != null)
            user.setAvatarUrl(dto.avatarUrl().isBlank() ? null : dto.avatarUrl());
        userRepository.save(user);
        return getProfile(user);
    }

    private int calculateStreak(User user) {
        Set<LocalDate> daysWithReview = progressRepository.findByUser(user)
                .stream()
                .filter(fp -> fp.getLastReview() != null)
                .map(fp -> fp.getLastReview().toLocalDate())
                .collect(Collectors.toSet());
        int streak = 0;
        LocalDate day = LocalDate.now();
        while(daysWithReview.contains(day)) {
            streak++;
            day = day.minusDays(1);
        }
        return streak;
    }
}
