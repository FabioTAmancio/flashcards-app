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

    @Autowired private FlashcardRepository flashcardRepository;
    @Autowired private FlashcardProgressRepository progressRepository;
    @Autowired private DeckRepository deckRepository;
    @Autowired private CloudinaryService cloudinaryService;

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final long MAX_IMAGE_BYTES = 20L * 1024 * 1024; // 20MB por imagem

    @Transactional
    public ApkgImportResultDTO importApkg(MultipartFile file, Long deckId, User user) throws Exception {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new RuntimeException("Deck não encontrado"));
        if (!deck.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Deck não pertence ao usuário");

        Path tempDir = Files.createTempDirectory("apkg_");
        try {
            // Streaming direto para disco — não carrega o .apkg inteiro na heap
            unzipStream(file.getInputStream(), tempDir);

            Map<String, String> mediaMap = readMediaMap(tempDir);
            Path dbPath = findDatabase(tempDir);
            ensureSqliteFile(dbPath);

            int imported = 0, skipped = 0, imagesUploaded = 0;
            List<String> errors = new ArrayList<>();

            try (Connection conn = DriverManager.getConnection("jdbc:sqlite:" + dbPath.toAbsolutePath())) {
                List<Map<String, String>> cards = extractCards(conn);
                System.out.println("[APKG] found " + cards.size() + " cards");

                for (Map<String, String> cardData : cards) {
                    try {
                        String front = cardData.get("front");
                        String back  = cardData.get("back");
                        if (isBlank(front) || isBlank(back)) { skipped++; continue; }

                        ImageProcessResult frontResult = processImages(front, mediaMap, tempDir, errors);
                        ImageProcessResult backResult  = processImages(back,  mediaMap, tempDir, errors);
                        imagesUploaded += frontResult.uploadCount + backResult.uploadCount;

                        Flashcard f = new Flashcard();
                        f.setFront(stripHtml(frontResult.text));
                        f.setBack(stripHtml(backResult.text));
                        f.setSubject(deck.getName());
                        f.setDeck(deck); f.setUser(user);
                        f.setCardType(CardType.BASIC);
                        if (!frontResult.imageUrls.isEmpty()) f.setFrontImageUrl(frontResult.imageUrls.get(0));
                        if (!backResult.imageUrls.isEmpty())  f.setBackImageUrl(backResult.imageUrls.get(0));

                        flashcardRepository.save(f);
                        createProgress(user, f);
                        imported++;
                    } catch (Exception e) {
                        skipped++;
                        errors.add("Card ignorado: " + e.getMessage());
                    }
                }
            }

            return new ApkgImportResultDTO(imported, skipped, imagesUploaded, errors);

        } finally {
            deleteDirectory(tempDir);
            System.gc(); // sugere GC após operação pesada
        }
    }

    // ── Streaming para disco — buffer de 8KB, zero heap extra ────────────────

    private void unzipStream(InputStream is, Path destDir) throws IOException {
        byte[] buf = new byte[8192];
        try (ZipInputStream zis = new ZipInputStream(new BufferedInputStream(is, 65536))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                Path target = destDir.resolve(entry.getName()).normalize();
                if (!target.startsWith(destDir)) throw new IOException("Zip path traversal: " + entry.getName());
                if (entry.isDirectory()) {
                    Files.createDirectories(target);
                } else {
                    Files.createDirectories(target.getParent());
                    try (OutputStream out = new BufferedOutputStream(Files.newOutputStream(target))) {
                        int len;
                        while ((len = zis.read(buf)) != -1) out.write(buf, 0, len);
                    }
                }
                zis.closeEntry();
            }
        }
    }

    // ── Detecta compressão zlib (Anki 2.1.28+) ───────────────────────────────

    private void ensureSqliteFile(Path dbPath) throws IOException {
        byte[] header = new byte[16];
        try (InputStream is = Files.newInputStream(dbPath)) {
            if (is.read(header) < 16) return;
        }

        if (!new String(Arrays.copyOf(header, 15)).equals("SQLite format 3")) {
            System.out.println("[APKG] not SQLite, trying zlib decompress...");
            Path tmp = dbPath.resolveSibling(dbPath.getFileName() + ".tmp");
            try {
                byte[] buf = new byte[8192];
                try (InputStream fis = new BufferedInputStream(Files.newInputStream(dbPath));
                     InflaterInputStream iis = new InflaterInputStream(fis);
                     OutputStream out = new BufferedOutputStream(Files.newOutputStream(tmp))) {
                    int n;
                    while ((n = iis.read(buf)) != -1) out.write(buf, 0, n);
                }
                Files.move(tmp, dbPath, StandardCopyOption.REPLACE_EXISTING);
                System.out.println("[APKG] zlib decompress ok");
            } catch (Exception e) {
                System.out.println("[APKG] zlib failed: " + e.getMessage());
                if (Files.exists(tmp)) Files.delete(tmp);
            }
        }
    }

    // ── Extrai cards do SQLite ────────────────────────────────────────────────

    private List<Map<String, String>> extractCards(Connection conn) throws SQLException {
        List<Map<String, String>> result = new ArrayList<>();
        try {
            try (Statement s = conn.createStatement();
                 ResultSet rs = s.executeQuery(
                         "SELECT n.flds FROM cards c JOIN notes n ON c.nid = n.id WHERE c.queue != -1 GROUP BY n.id"
                 )) {
                while (rs.next()) parseFields(rs.getString("flds"), result);
            }
            if (!result.isEmpty()) return result;
        } catch (SQLException e) {
            System.out.println("[APKG] JOIN failed: " + e.getMessage());
        }
        try (Statement s = conn.createStatement();
             ResultSet rs = s.executeQuery("SELECT flds FROM notes")) {
            while (rs.next()) parseFields(rs.getString("flds"), result);
        } catch (SQLException e) {
            System.out.println("[APKG] notes query failed: " + e.getMessage());
        }
        return result;
    }

    private void parseFields(String flds, List<Map<String, String>> result) {
        if (flds == null) return;
        String[] parts = flds.split("\u001f", -1);
        if (parts.length >= 2 && !isBlank(parts[0]) && !isBlank(parts[1])) {
            Map<String, String> card = new HashMap<>();
            card.put("front", parts[0].trim());
            card.put("back",  parts[1].trim());
            result.add(card);
        }
    }

    // ── Processa imagens com limite de tamanho ────────────────────────────────

    private ImageProcessResult processImages(String html, Map<String, String> mediaMap, Path tempDir, List<String> errors) {
        List<String> imageUrls = new ArrayList<>();
        int uploadCount = 0;
        Matcher matcher = Pattern.compile("<img[^>]+src=[\"']([^\"']+)[\"'][^>]*>", Pattern.CASE_INSENSITIVE).matcher(html);
        StringBuffer sb = new StringBuffer();

        while (matcher.find()) {
            String src = matcher.group(1);
            String fileName = mediaMap.getOrDefault(src, src);
            Path imagePath = tempDir.resolve(fileName);

            if (Files.exists(imagePath)) {
                try {
                    long fileSize = Files.size(imagePath);
                    if (fileSize > MAX_IMAGE_BYTES) {
                        errors.add("Imagem muito grande ignorada: " + fileName + " (" + fileSize / 1024 / 1024 + "MB)");
                        matcher.appendReplacement(sb, "");
                        continue;
                    }
                    byte[] imageBytes = Files.readAllBytes(imagePath);
                    String cloudUrl = cloudinaryService.upload(
                            new MockMultipartFile(fileName, fileName, detectMime(fileName), imageBytes)
                    );
                    imageUrls.add(cloudUrl);
                    uploadCount++;
                    matcher.appendReplacement(sb, "<img src=\"" + cloudUrl + "\">");
                } catch (Exception e) {
                    errors.add("Imagem ignorada (" + fileName + "): " + e.getMessage());
                    matcher.appendReplacement(sb, "");
                }
            } else {
                matcher.appendReplacement(sb, "");
            }
        }
        matcher.appendTail(sb);
        return new ImageProcessResult(sb.toString(), imageUrls, uploadCount);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private Map<String, String> readMediaMap(Path tempDir) throws IOException {
        Path mediaFile = tempDir.resolve("media");
        if (!Files.exists(mediaFile)) return Collections.emptyMap();
        return objectMapper.readValue(mediaFile.toFile(), Map.class);
    }

    private Path findDatabase(Path tempDir) throws IOException {
        for (String name : List.of("collection.anki21", "collection.anki2")) {
            Path p = tempDir.resolve(name);
            if (Files.exists(p)) return p;
        }
        try (var stream = Files.walk(tempDir)) {
            return stream
                    .filter(p -> p.getFileName().toString().matches(".*\\.anki2[1]?"))
                    .findFirst()
                    .orElseThrow(() -> new IOException("Banco não encontrado no .apkg"));
        }
    }

    private String stripHtml(String html) {
        if (html == null) return "";
        return html.replaceAll("<br\\s*/?>", "\n").replaceAll("<[^>]+>", "")
                .replaceAll("&nbsp;", " ").replaceAll("&lt;", "<").replaceAll("&gt;", ">")
                .replaceAll("&amp;", "&").replaceAll("&quot;", "\"")
                .replaceAll("\\s+", " ").trim();
    }

    private String detectMime(String fileName) {
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png"))  return "image/png";
        if (lower.endsWith(".gif"))  return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }

    private void createProgress(User user, Flashcard flashcard) {
        if (!progressRepository.existsByUserAndFlashcard(user, flashcard)) {
            FlashcardProgress p = new FlashcardProgress();
            p.setUser(user); p.setFlashcard(flashcard);
            p.setInterval(1); p.setEaseFactor(2.5); p.setRepetitions(0);
            p.setNextReview(LocalDateTime.now()); p.setStatus(CardStatus.NEW);
            progressRepository.save(p);
        }
    }

    private void deleteDirectory(Path dir) {
        try {
            if (!Files.exists(dir)) return;
            Files.walk(dir).sorted(Comparator.reverseOrder()).map(Path::toFile).forEach(File::delete);
        } catch (IOException ignored) {}
    }

    private static boolean isBlank(String s) { return s == null || s.isBlank(); }
    private record ImageProcessResult(String text, List<String> imageUrls, int uploadCount) {}
}
 