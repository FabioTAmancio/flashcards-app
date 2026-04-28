package com.fabio.flashcards_app.config;


import com.cloudinary.Cloudinary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Configuration
public class CloudinaryConfig {

    @Value("${cloudinary.cloudname}")
    private String cloudName;

    @Value("${cloudinary.api-key}")
    private String apiKey;

    @Value("${cloudinary.api-secret} ")
    private String apiSecret;

    // URL format: cloudinary://api_key:api_secret@cloud_name
    @Bean
    public Cloudinary cloudinary() {
        String url = String.format("cloudinary://%s:%s@%s", apiKey, apiSecret, cloudName);
        return new Cloudinary(url);
    }
}
