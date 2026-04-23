package com.fabio.flashcards_app.security;

import com.auth0.jwt.exceptions.TokenExpiredException;
import com.fabio.flashcards_app.domain.models.User;
import com.fabio.flashcards_app.domain.repositories.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class SecurityFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Autowired
    UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        if (request.getMethod().equals("OPTIONS")) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.replace("Bearer ", "");

        try {
            String email = jwtService.validateToken(token);

            User user = userRepository.findByEmail(email)
                    .orElseThrow();

            UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        user, // 🔥 AQUI ESTÁ A CORREÇÃO
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()))
                );

            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (Exception e) {
            // pode logar se quiser
        }

        filterChain.doFilter(request, response);
    }
}
