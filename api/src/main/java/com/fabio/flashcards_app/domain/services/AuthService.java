package com.fabio.flashcards_app.domain.services;

import com.fabio.flashcards_app.data.dto.auth.AuthResponseDTO;
import com.fabio.flashcards_app.data.dto.auth.LoginDTO;
import com.fabio.flashcards_app.data.dto.auth.RegisterDTO;
import com.fabio.flashcards_app.domain.models.User;
import com.fabio.flashcards_app.domain.repositories.UserRepository;
import com.fabio.flashcards_app.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    public AuthResponseDTO register(RegisterDTO dto) {
        User user = new User();
        user.setName(dto.name());
        user.setEmail(dto.email());
        user.setPassword(dto.password()); // after we gonna encrypting
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
                .orElseThrow();

        // auth password
        if(!user.getPassword().equals(dto.password())) {
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
