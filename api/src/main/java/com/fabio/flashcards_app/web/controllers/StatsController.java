package com.fabio.flashcards_app.web.controllers;

import com.fabio.flashcards_app.data.dto.stats.StatsResponseDTO;
import com.fabio.flashcards_app.data.dto.stats.UserResponseDTO;
import com.fabio.flashcards_app.domain.models.User;
import com.fabio.flashcards_app.domain.services.StatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/stats")
public class StatsController {

    @Autowired
    private StatsService statsService;

    @GetMapping
    public ResponseEntity<StatsResponseDTO> getStatus(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(statsService.getStats(user));
    }
}
