package com.fabio.flashcards_app.domain.services;

import com.fabio.flashcards_app.data.dto.imports.ApkgImportResultDTO;
import com.fabio.flashcards_app.domain.models.Deck;
import com.fabio.flashcards_app.domain.models.Flashcard;
import com.fabio.flashcards_app.domain.models.FlashcardProgress;
import com.fabio.flashcards_app.domain.models.User;
import com.fabio.flashcards_app.domain.models.enums.CardStatus;
import com.fabio.flashcards_app.domain.models.enums.CardType;
import com.fabio.flashcards_app.domain.repositories.DeckRepository;
import com.fabio.flashcards_app.domain.repositories.FlashcardProgressRepository;
import com.fabio.flashcards_app.domain.repositories.FlashcardRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.*;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.zip.*;
import java.util.regex.*;


@Service
public class ApkgImportService {

//    @Autowired private FlashcardRepository flashcardRepository;
//    @Autowired private FlashcardProgressRepository progressRepository;
//    @Autowired private DeckRepository deckRepository;
//    @Autowired private CloudinaryService cloudinaryService;
//
//    private static final ObjectMapper objectMapper = new ObjectMapper();
//
//    @Transactional
//    public ApkgImportResultDTO importApkg(MultipartFile file, Long deckId, User user) throws Exception {
//        Deck deck = deckRepository.findById(deckId)
//                .orElseThrow(() -> new RuntimeException("Deck not found"));
//        if(!deck.getUser().getId().equals(user.getId())) {
//            throw new RuntimeException("Deck does not belong this user");
//        }
//
//        //create temp dir
//        Path tempDir = Files.createTempDirectory("apkg_");
//        try {
//            //Unpack .apkg
//            unzip(file.getInputStream(), tempDir);
//
//            //Ready midia map: {"0": "filename.jpg", "1": "filename2.png", ...}
//            Map<String, String> mediaMap = readMediaMap(tempDir);
//
//            //Connect to SQLite
//            Path dbPath = findDatabase(tempDir);
//            String jdbcUrl = "jdbc:sqlite:" + dbPath.toAbsolutePath();
//
//            int imported = 0, skipped = 0, imagesUploaded = 0;
//            List<String> errors = new ArrayList<>();
//
//            try(Connection conn = DriverManager.getConnection(jdbcUrl)) {
//                //Collect version of Anki schema (anki2 vs anki21)
//                List<Map<String, String>> cards = extractCards(conn);
//
//                for(Map<String, String> card : cards) {
//                    try {
//                        String front = card.get("front");
//                        String back = card.get("back");
//
//                        if(isBlank(front) || isBlank(back)) {
//                            skipped++;
//                            continue;
//                        }
//
//                        //Process the image inline in fields
//                        ImageProcessResult frontResult = processImages(front, mediaMap, tempDir, errors);
//                        ImageProcessResult backResult = processImages(back, mediaMap, tempDir, errors);
//                        imagesUploaded += frontResult.uploadCount + backResult.uploadCount;
//
//                        //Create flashcard
//                        Flashcard f = new Flashcard();
//                        f.setFront(stripHtml(frontResult.text));
//                        f.setBack(stripHtml(backResult.text));
//                        f.setSubject(deck.getName());
//                        f.setDeck(deck);
//                        f.setUser(user);
//                        f.setCardType(CardType.BASIC);
//
//                        //if find the image, use first by frontImageUrl/backImageUrl
//                        if(!frontResult.imageUrls.isEmpty()) {
//                            f.setFrontImageUrl(frontResult.imageUrls.get(0));
//                        }
//                        if(!backResult.imageUrls.isEmpty()) {
//                            f.setBackImageUrl(backResult.imageUrls.get(0));
//                        }
//
//                        flashcardRepository.save(f);
//                        createProgress(user, f);
//                        imported++;
//                    } catch(Exception e) {
//                        skipped++;
//                        errors.add("Ignored Card: " + e.getMessage());
//                    }
//                }
//            }
//
//            return new ApkgImportResultDTO(imported, skipped, imagesUploaded, errors);
//        } finally {
//            //Clean temp files
//            deleteDirectory(tempDir);
//        }
//    }
//
//    private List<Map<String, String>> extractCards(Connection conn) throws SQLException {
//        List<Map<String, String>> result = new ArrayList<>();
//
//        //Try chema anki21 first, after anki2
//        String query = """
//            SELECT n.flds
//            FROM cards c
//            JOIN notes n ON c.nid = n.id
//            WHERE c.queue != -1
//            GROUP BY n.id
//        """;
//
//        try(Statement stmt = conn.createStatement();
//            ResultSet rs = stmt.executeQuery(query)) {
//
//            while(rs.next()) {
//                String flds = rs.getString("flds");
//                if(flds == null) continue;
//
//                // Split fields by caractere \x1f ASCII 31
//                String[] parts = flds.split("\u001f", -1);
//                if(parts.length >= 2) {
//                    Map<String, String> card = new HashMap<>();
//                    card.put("front", parts[0].trim());
//                    card.put("back", parts[1].trim());
//                    result.add(card);
//                }
//            }
//        }
//        return result;
//    }
//
//    private ImageProcessResult processImages(
//            String html, Map<String, String> mediaMap,
//            Path tempDir, List<String> errors
//    ) {
//        List<String> imageUrls = new ArrayList<>();
//        int uploadCount = 0;
//
//        Pattern imgPattern = Pattern.compile(
//                "<img[^>]+src=[\"']([^\"']+)[\"'][^>]*>",
//                Pattern.CASE_INSENSITIVE
//        );
//        Matcher matcher = imgPattern.matcher(html);
//        StringBuffer sb = new StringBuffer();
//
//        while(matcher.find()) {
//            String src = matcher.group(1);
//
//            String fileName = mediaMap.getOrDefault(src, src);
//            Path imagePath = tempDir.resolve(fileName);
//
//            if (Files.exists(imagePath)) {
//                try {
//                    byte[] imageBytes = Files.readAllBytes(imagePath);
//                    String mimeType = detectMime(fileName);
//
//                    MultipartFile mf = new MockMultipartFile(
//                            fileName, fileName, mimeType, imageBytes
//                    );
//                    String cloudUrl = cloudinaryService.upload(mf);
//                    imageUrls.add(cloudUrl);
//                    uploadCount++;
//
//                    // Substitui a tag img pela URL do Cloudinary
//                    matcher.appendReplacement(sb,
//                            "<img src=\"" + cloudUrl + "\">"
//                    );
//                } catch (Exception e) {
//                    errors.add("Imagem ignorada (" + fileName + "): " + e.getMessage());
//                    matcher.appendReplacement(sb, "");
//                }
//            } else {
//                matcher.appendReplacement(sb, "");
//            }
//        }
//        matcher.appendTail(sb);
//        return new ImageProcessResult(sb.toString(), imageUrls, uploadCount);
//    }
//
//    // Helpers
//    private void unzip(InputStream is, Path destDir) throws IOException {
//        try(ZipInputStream zis = new ZipInputStream(is)) {
//            ZipEntry entry;
//            while((entry = zis.getNextEntry()) != null) {
//                Path target = destDir.resolve(entry.getName()).normalize();
//                if(!target.startsWith(destDir)) {
//                    throw new IOException("Zip path traversal detectado: " + entry.getName());
//                }
//                if(entry.isDirectory()) {
//                    Files.createDirectories(target);
//                } else {
//                    Files.createDirectories(target.getParent());
//                    Files.copy(zis, target, StandardCopyOption.REPLACE_EXISTING);
//                }
//                zis.closeEntry();
//            }
//        }
//    }
//
//    @SuppressWarnings("unchecked")
//    private Map<String, String> readMediaMap(Path tempDir) throws IOException {
//        Path mediaFile = tempDir.resolve("media");
//        if(!Files.exists(mediaFile)) {
//            return Collections.emptyMap();
//        }
//        String json = Files.readString(mediaFile);
//        return objectMapper.readValue(json, Map.class);
//    }
//
//    private Path findDatabase(Path tempDir) throws IOException {
//        //try collection.anki21 first, after try anki2
//        Path anki21 = tempDir.resolve("collection.anki21");
//        if(Files.exists(anki21)) {
//            return anki21;
//        }
//        Path anki2 = tempDir.resolve("collection.anki2");
//        if(Files.exists(anki2)) {
//            return anki2;
//        }
//        throw new IOException("File in db not found");
//    }
//
//    private String stripHtml(String html) {
//        if(html == null) {
//            return "";
//        }
//        return html
//                .replaceAll("<br\\s*/?>", "\n")
//                .replaceAll("<[^>]+>", "")
//                .replaceAll("&nbsp;", " ")
//                .replaceAll("&lt;", "<")
//                .replaceAll("&gt;", ">")
//                .replaceAll("&amp;", "&")
//                .replaceAll("&quot;", "\"")
//                .replaceAll("\\s+", " ")
//                .trim();
//    }
//
//    private String detectMime(String fileName) {
//        String lower = fileName.toLowerCase();
//        if(lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jped";
//        if (lower.endsWith(".png"))  return "image/png";
//        if (lower.endsWith(".gif"))  return "image/gif";
//        if (lower.endsWith(".webp")) return "image/webp";
//        if (lower.endsWith(".svg"))  return "image/svg+xml";
//        return "image/jpeg";
//    }
//
//    private void createProgress(User user, Flashcard flashcard) {
//        if(!progressRepository.existsByUserAndFlashcard(user, flashcard)) {
//            FlashcardProgress p = new FlashcardProgress();
//            p.setUser(user);
//            p.setFlashcard(flashcard);
//            p.setInterval(1);
//            p.setEaseFactor(2.5);
//            p.setRepetitions(0);
//            p.setNextReview(LocalDateTime.now());
//            p.setStatus(CardStatus.NEW);
//            progressRepository.save(p);
//        }
//    }
//
//    private void deleteDirectory(Path dir) throws IOException {
//        if(!Files.exists(dir)) return;
//        Files.walk(dir)
//                .sorted(Comparator.reverseOrder())
//                .map(Path::toFile)
//                .forEach(File::delete);
//    }
//
//    private static boolean isBlank(String s) {
//        return s == null || s.isBlank();
//    }
//
//    private record ImageProcessResult(
//            String text,
//            List<String> imageUrls,
//            int uploadCount
//    ) {}

}