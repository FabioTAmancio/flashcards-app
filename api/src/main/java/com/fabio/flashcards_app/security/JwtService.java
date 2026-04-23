package com.fabio.flashcards_app.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.fabio.flashcards_app.domain.models.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class JwtService {

    @Value("${api.security.token.secret}")
    private String secret;

    public String generateToken(User user) {
        return JWT.create()
                .withSubject(user.getEmail())
                .sign(Algorithm.HMAC256(secret));
    }

    public String validateToken(String token) {
        return JWT.require(Algorithm.HMAC256(secret))
                .build()
                .verify(token)
                .getSubject();
    }


}
