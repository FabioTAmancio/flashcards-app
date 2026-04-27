package com.fabio.flashcards_app.domain.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;


@Service
public class EmailService {

    @Value("${resend.api-key}")
    private String apiKey;

    @Value("${resend.from}")
    private String from;

    @Value("${app.base-url}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendVerificationEmail(String toEmail, String userName, String token) {
        String verifyUrl = baseUrl + "/auth/verify?token=" + token;

        String html = """
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0a0a0f; color: #e5e7eb; border-radius: 16px;">
              <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 8px; color: #fff; letter-spacing: -0.5px;">
                flash<span style="color: #aa3bff;">.</span>
              </h1>
              <p style="color: #9ca3af; margin-bottom: 32px; font-size: 14px;">Seu app de flashcards com repetição espaçada</p>

              <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 8px; color: #fff;">
                Olá, %s! 👋
              </h2>
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin-bottom: 28px;">
                Sua conta foi criada com sucesso. Clique no botão abaixo para verificar seu email e liberar todos os recursos do flash.
              </p>

              <a href="%s" style="display: inline-block; padding: 12px 28px; background: #aa3bff; color: #fff; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; margin-bottom: 24px;">
                Verificar email
              </a>

              <p style="color: #6b7280; font-size: 12px; line-height: 1.6;">
                O link expira em <strong style="color: #9ca3af;">24 horas</strong>.<br>
                Se você não criou uma conta, ignore este email.
              </p>

              <hr style="border: none; border-top: 1px solid #1f2028; margin: 24px 0;">
              <p style="color: #4b5563; font-size: 11px;">
                Não consegue clicar no botão? Copie e cole este link no navegador:<br>
                <span style="color: #6b7280; word-break: break-all;">%s</span>
              </p>
            </div>
        """.formatted(userName, verifyUrl, verifyUrl);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> body = Map.of(
                "from", from,
                "to", new String[]{ toEmail },
                "subject", "Verifique seu email -> flash.",
                "html", html
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            restTemplate.postForEntity("https://api.resend.com/emails", request, String.class);
        } catch (Exception e) {
            //Log but don t break flow
            System.err.println("Erro ao enviar o email: " + e.getMessage());
        }
    }

}
