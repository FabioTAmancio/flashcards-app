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

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public AuthResponseDTO register(RegisterDTO dto) {
        if(userRepository.findByEmail(dto.email()).isPresent()) {
            throw new RuntimeException("Email already in use");
        }

        User user = new User();
        user.setName(dto.name());
        user.setEmail(dto.email());
        // Hash BCrypt before save
        user.setPassword(passwordEncoder.encode(dto.password()));
        user.setRole("USER");

        userRepository.save(user);

        String token = jwtService.generateToken(user);
        return new AuthResponseDTO(
                token,
                user.getName(),
                user.getEmail(),
                user.getRole()
        );
    }

    public AuthResponseDTO login(LoginDTO dto) {
        User user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new RuntimeException("Email not found"));

        // auth password
        if (!passwordEncoder.matches(dto.password(), user.getPassword())) {
            throw new RuntimeException("Wrong password");
        }

        String token = jwtService.generateToken(user);

        return new AuthResponseDTO(
                token,
                user.getName(),
                user.getEmail(),
                user.getRole()
        );
    }
}
