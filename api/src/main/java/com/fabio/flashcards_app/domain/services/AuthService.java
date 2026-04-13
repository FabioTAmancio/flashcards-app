package com.fabio.flashcards_app.domain.services;

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

    public String register(String name, String email, String password) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(password); // after we gonna encrypting
        user.setRole("USER");

        userRepository.save(user);

        return jwtService.generateToken(user);
    }

    public String login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow();

        if(!user.getPassword().equals(password)) {
            throw new RuntimeException("Wrong password");
        }

        return jwtService.generateToken(user);
    }
}
