package com.fabio.flashcards_app.domain.services;

import com.fabio.flashcards_app.data.dto.auth.AuthResponseDTO;
import com.fabio.flashcards_app.data.dto.auth.LoginDTO;
import com.fabio.flashcards_app.data.dto.auth.RegisterDTO;
import com.fabio.flashcards_app.domain.models.User;
import com.fabio.flashcards_app.domain.repositories.UserRepository;
import com.fabio.flashcards_app.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    public AuthResponseDTO register(RegisterDTO dto) {
        if(userRepository.findByEmail(dto.email()).isPresent()) {
            throw new RuntimeException("Email already in use");
        }

        String token = UUID.randomUUID().toString();

        User user = new User();
        user.setName(dto.name());
        user.setEmail(dto.email());
        // Hash BCrypt before save
        user.setPassword(passwordEncoder.encode(dto.password()));
        user.setRole("USER");
        user.setEmailVerified(false);
        user.setVerificationToken(token);
        user.setTokeExpiresAt(LocalDateTime.now().plusHours(24));

        userRepository.save(user);

        emailService.sendVerificationEmail(user.getEmail(), user.getName(), token);

        String jwt = jwtService.generateToken(user);
        return toDTO(user, jwt);
    }

    public AuthResponseDTO login(LoginDTO dto) {
        User user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new RuntimeException("Email not found"));

        // auth password
        if (!passwordEncoder.matches(dto.password(), user.getPassword())) {
            throw new RuntimeException("Wrong password");
        }

        String jwt = jwtService.generateToken(user);
        return toDTO(user, jwt);
    }

    public void verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("Token not found or invalid"));

        if(user.getTokeExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token expired");
        }

        user.setEmailVerified(true);
        user.setVerificationToken(null);
        user.setTokeExpiresAt(null);
        userRepository.save(user);
    }

    public void resendVerification(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email not found"));

        if(Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new RuntimeException("Email already verified");
        }

        String token = UUID.randomUUID().toString();
        user.setVerificationToken(token);
        user.setTokeExpiresAt(LocalDateTime.now().plusHours(24));
        userRepository.save(user);

        emailService.sendVerificationEmail(user.getEmail(), user.getName(), token);
    }

    private AuthResponseDTO toDTO(User user, String jwt) {
        return new AuthResponseDTO(
                jwt,
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getEmailVerified()
        );
    }
}
