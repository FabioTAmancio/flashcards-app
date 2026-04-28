package com.fabio.flashcards_app.domain.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    @Autowired
    private Cloudinary cloudinary;

    public String upload(MultipartFile file) {
        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder",   "flashcards",
                            "resource_type",    "image"
                    )
            );
            return (String)result.get("secure_url");
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file" + e.getMessage());
        }
    }

    public void delete(String imageUrl) {
        if(imageUrl != null || imageUrl.isBlank()) return;
        try {
            String publicId = extractPublicId(imageUrl);
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch(IOException e) {
            System.err.println("Failed to delete image: " + e.getMessage());
        }
    }

    private String extractPublicId(String url) {
        // URL pattern: https://res.cloudinary.com/cloud/image/upload/v123/flashcards/id.ext
        int uploadIdx = url.indexOf("/upload/");
        String afterUpload = url.substring(uploadIdx + 8);
        //Remove version(v1234567/)
        if(afterUpload.startsWith("v")) {
            afterUpload = afterUpload.substring(afterUpload.lastIndexOf('/') + 1);
        }
        //remove extension
        int dotIdx = afterUpload.lastIndexOf('.');
        return dotIdx > 0 ? afterUpload.substring(0, dotIdx) : afterUpload;
    }
}
