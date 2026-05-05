package com.fabio.flashcards_app.domain.services;

import com.fabio.flashcards_app.data.dto.imports.ApkgConfirmDTO;
import com.fabio.flashcards_app.data.dto.imports.ApkgPreviewDTO;
import com.fabio.flashcards_app.data.dto.imports.ApkgPreviewDTO.AnkiDeckPreview;
import com.fabio.flashcards_app.data.dto.imports.ApkgPreviewDTO.AnkiDeckPreview.ConflictResolution;
import com.fabio.flashcards_app.data.dto.imports.ApkgStructuredResultDTO;
import com.fabio.flashcards_app.domain.models.*;
import com.fabio.flashcards_app.domain.models.enums.CardStatus;
import com.fabio.flashcards_app.domain.models.enums.CardType;
import com.fabio.flashcards_app.domain.repositories.*;
import com.fasterxml.jackson.databind.JsonNode;
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
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.*;
import java.util.zip.*;

@Service
public class ApkgStructuredImportService {

    @Autowired private DeckRepository deckRepository;
    @Autowired private FolderRepository folderRepository;
    @Autowired private FlashcardRepository flashcardRepository;
    @Autowired private FlashcardProgressRepository progressRepository;
    @Autowired private CloudinaryService cloudinaryService;

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final long MAX_IMAGE_BYTES = 20L * 1024 * 1024;

    // Cache em memória dos arquivos temporários (uploadToken -> Path)
    // Em produção considere usar Redis ou disco com TTL
    private final Map<String, Path> tempDirCache = new ConcurrentHashMap<>();

    // ── ETAPA 1: Preview ──────────────────────────────────────────────────────
    // Descompacta o .apkg, lê a estrutura de decks e retorna para o frontend

    public ApkgPreviewDTO preview(MultipartFile file, User user) throws Exception {
        Path tempDir = Files.createTempDirectory("apkg_preview_");
        String uploadToken = UUID.randomUUID().toString();

        try {
            unzipStream(file.getInputStream(), tempDir);
            Path dbPath = findDatabase(tempDir);
            ensureSqliteFile(dbPath);

            List<AnkiDeckPreview> decks = new ArrayList<>();

            try (Connection conn = DriverManager.getConnection("jdbc:sqlite:" + dbPath.toAbsolutePath())) {
                // Lê estrutura de decks da tabela col
                Map<Long, AnkiDeckInfo> ankiDecks = readAnkiDecks(conn);

                for (AnkiDeckInfo info : ankiDecks.values()) {
                    // Conta cards deste deck
                    int cardCount = countCardsInDeck(conn, info.id);
                    if (cardCount == 0) continue;

                    // Monta caminho: "Idiomas::Inglês::Vocabulário"
                    String[] parts = info.name.split("::");
                    String deckName   = parts[parts.length - 1].trim();
                    String folderPath = parts.length > 1
                            ? String.join(" > ", Arrays.copyOf(parts, parts.length - 1))
                            : null;

                    // Verifica conflito: deck com mesmo nome já existe?
                    Deck existing = findExistingDeck(deckName, user);

                    decks.add(new AnkiDeckPreview(
                            info.id,
                            info.name,
                            deckName,
                            folderPath,
                            cardCount,
                            existing != null ? existing.getId() : null,
                            existing != null ? existing.getName() : null,
                            existing != null ? ConflictResolution.USE_EXISTING : ConflictResolution.CREATE_NEW
                    ));
                }
            }

            // Guarda o tempDir para a etapa de confirmação
            tempDirCache.put(uploadToken, tempDir);

            // Agenda limpeza em 30 minutos (simples)
            new Thread(() -> {
                try {
                    Thread.sleep(30 * 60 * 1000L);
                    deleteDirectory(tempDirCache.remove(uploadToken));
                } catch (Exception ignored) {}
            }).start();

            return new ApkgPreviewDTO(uploadToken, decks);

        } catch (Exception e) {
            deleteDirectory(tempDir);
            throw e;
        }
    }

    // ── ETAPA 2: Confirmar importação ─────────────────────────────────────────

    @Transactional
    public ApkgStructuredResultDTO confirm(ApkgConfirmDTO dto, User user) throws Exception {
        Path tempDir = tempDirCache.remove(dto.uploadToken());
        if (tempDir == null || !Files.exists(tempDir))
            throw new RuntimeException("Sessão expirada. Faça o upload novamente.");

        try {
            Path dbPath = findDatabase(tempDir);
            Map<String, String> mediaMap = readMediaMap(tempDir);

            int decksCreated = 0, decksReused = 0, foldersCreated = 0;
            int cardsImported = 0, cardsSkipped = 0, imagesUploaded = 0;
            List<String> errors = new ArrayList<>();

            try (Connection conn = DriverManager.getConnection("jdbc:sqlite:" + dbPath.toAbsolutePath())) {
                Map<Long, AnkiDeckInfo> ankiDecks = readAnkiDecks(conn);

                // Mapa de ankiDeckId -> Deck do app
                Map<Long, Deck> deckMap = new HashMap<>();

                for (AnkiDeckInfo info : ankiDecks.values()) {
                    int cardCount = countCardsInDeck(conn, info.id);
                    if (cardCount == 0) continue;

                    String[] parts       = info.name.split("::");
                    String deckName      = parts[parts.length - 1].trim();
                    String resolution    = dto.resolutions().getOrDefault(info.id, "CREATE_NEW");

                    Deck deck;

                    if ("USE_EXISTING".equals(resolution)) {
                        // Reutiliza deck existente
                        deck = findExistingDeck(deckName, user);
                        if (deck == null) deck = createDeck(deckName, null, user);
                        decksReused++;
                    } else {
                        // Cria pastas e deck novo
                        Folder folder = null;
                        if (parts.length > 1) {
                            FolderResult fr = findOrCreateFolderPath(
                                    Arrays.copyOf(parts, parts.length - 1), user
                            );
                            folder = fr.folder;
                            foldersCreated += fr.created;
                        }
                        deck = createDeck(deckName, folder, user);
                        decksCreated++;
                    }

                    deckMap.put(info.id, deck);
                }

                // Importa os cards associando ao deck correto
                List<CardRow> cards = extractCardsWithDeckId(conn);

                for (CardRow row : cards) {
                    Deck targetDeck = deckMap.get(row.deckId);
                    if (targetDeck == null) { cardsSkipped++; continue; }

                    try {
                        if (isBlank(row.front) || isBlank(row.back)) { cardsSkipped++; continue; }

                        ImageProcessResult fr = processImages(row.front, mediaMap, tempDir, errors);
                        ImageProcessResult br = processImages(row.back,  mediaMap, tempDir, errors);
                        imagesUploaded += fr.uploadCount + br.uploadCount;

                        Flashcard f = new Flashcard();
                        f.setFront(stripHtml(fr.text));
                        f.setBack(stripHtml(br.text));
                        f.setSubject(targetDeck.getName());
                        f.setDeck(targetDeck);
                        f.setUser(user);
                        f.setCardType(CardType.BASIC);
                        if (!fr.imageUrls.isEmpty()) f.setFrontImageUrl(fr.imageUrls.get(0));
                        if (!br.imageUrls.isEmpty())  f.setBackImageUrl(br.imageUrls.get(0));

                        flashcardRepository.save(f);
                        createProgress(user, f);
                        cardsImported++;

                    } catch (Exception e) {
                        cardsSkipped++;
                        errors.add("Card ignorado: " + e.getMessage());
                    }
                }
            }

            return new ApkgStructuredResultDTO(
                    decksCreated, decksReused, foldersCreated,
                    cardsImported, cardsSkipped, imagesUploaded, errors
            );

        } finally {
            deleteDirectory(tempDir);
            System.gc();
        }
    }

    // ── Lê estrutura de decks da tabela col do Anki ───────────────────────────
    // O Anki armazena os decks como JSON na coluna `decks` da tabela `col`

    private Map<Long, AnkiDeckInfo> readAnkiDecks(Connection conn) throws Exception {
        Map<Long, AnkiDeckInfo> result = new LinkedHashMap<>();

        try (Statement s = conn.createStatement();
             ResultSet rs = s.executeQuery("SELECT decks FROM col LIMIT 1")) {

            if (!rs.next()) return result;
            String json = rs.getString("decks");
            JsonNode root = objectMapper.readTree(json);

            root.fields().forEachRemaining(entry -> {
                try {
                    long id     = Long.parseLong(entry.getKey());
                    String name = entry.getValue().get("name").asText();
                    // Ignora o deck raiz "Default" se estiver vazio
                    if (!"Default".equalsIgnoreCase(name) || id != 1) {
                        result.put(id, new AnkiDeckInfo(id, name));
                    }
                } catch (Exception ignored) {}
            });
        } catch (SQLException e) {
            // Anki 2.1.28+ usa schema diferente
            System.out.println("[APKG] col query failed, trying notetypes: " + e.getMessage());
        }

        return result;
    }

    private int countCardsInDeck(Connection conn, long deckId) {
        try (PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*) FROM cards WHERE did = ? AND queue != -1")) {
            ps.setLong(1, deckId);
            ResultSet rs = ps.executeQuery();
            return rs.next() ? rs.getInt(1) : 0;
        } catch (SQLException e) {
            return 0;
        }
    }

    private List<CardRow> extractCardsWithDeckId(Connection conn) throws SQLException {
        List<CardRow> result = new ArrayList<>();
        try (Statement s = conn.createStatement();
             ResultSet rs = s.executeQuery("""
                SELECT c.did, n.flds
                FROM cards c
                JOIN notes n ON c.nid = n.id
                WHERE c.queue != -1
                GROUP BY n.id
             """)) {
            while (rs.next()) {
                long deckId = rs.getLong("did");
                String flds = rs.getString("flds");
                if (flds == null) continue;
                String[] parts = flds.split("\u001f", -1);
                if (parts.length >= 2)
                    result.add(new CardRow(deckId, parts[0].trim(), parts[1].trim()));
            }
        } catch (SQLException e) {
            // Fallback sem JOIN
            try (Statement s = conn.createStatement();
                 ResultSet rs = s.executeQuery("SELECT flds FROM notes")) {
                while (rs.next()) {
                    String flds = rs.getString("flds");
                    if (flds == null) continue;
                    String[] parts = flds.split("\u001f", -1);
                    if (parts.length >= 2)
                        result.add(new CardRow(1L, parts[0].trim(), parts[1].trim()));
                }
            }
        }
        return result;
    }

    // ── Cria hierarquia de pastas recursivamente ──────────────────────────────
    // Ex: ["Idiomas", "Inglês"] → cria "Idiomas" na raiz, depois "Inglês" dentro

    private FolderResult findOrCreateFolderPath(String[] pathParts, User user) {
        int created = 0;
        Folder parent = null;

        for (String part : pathParts) {
            String folderName = part.trim();
            // Procura pasta com esse nome e esse pai
            Folder finalParent = parent;
            Folder existing = folderRepository.findByUser(user).stream()
                    .filter(f -> f.getName().equalsIgnoreCase(folderName)
                            && Objects.equals(
                            f.getParent() != null ? f.getParent().getId() : null,
                            finalParent != null ? finalParent.getId() : null
                    ))
                    .findFirst().orElse(null);

            if (existing != null) {
                parent = existing;
            } else {
                Folder newFolder = new Folder();
                newFolder.setName(folderName);
                newFolder.setUser(user);
                newFolder.setParent(parent);
                folderRepository.save(newFolder);
                parent = newFolder;
                created++;
            }
        }

        return new FolderResult(parent, created);
    }

    private Deck createDeck(String name, Folder folder, User user) {
        Deck deck = new Deck();
        deck.setName(name);
        deck.setUser(user);
        deck.setFolder(folder);
        deck.setReviewEnabled(true);
        deck.setIsPublic(false);
        return deckRepository.save(deck);
    }

    private Deck findExistingDeck(String name, User user) {
        return deckRepository.findByUser(user).stream()
                .filter(d -> d.getName().equalsIgnoreCase(name))
                .findFirst().orElse(null);
    }

    // ── Processa imagens ──────────────────────────────────────────────────────

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
                    if (Files.size(imagePath) > MAX_IMAGE_BYTES) {
                        errors.add("Imagem muito grande ignorada: " + fileName);
                        matcher.appendReplacement(sb, "");
                        continue;
                    }
                    byte[] bytes = Files.readAllBytes(imagePath);
                    String url = cloudinaryService.upload(
                            new MockMultipartFile(fileName, fileName, detectMime(fileName), bytes)
                    );
                    imageUrls.add(url);
                    uploadCount++;
                    matcher.appendReplacement(sb, "<img src=\"" + url + "\">");
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

    // ── Helpers de arquivo ────────────────────────────────────────────────────

    private void unzipStream(InputStream is, Path destDir) throws IOException {
        byte[] buf = new byte[8192];
        try (ZipInputStream zis = new ZipInputStream(new BufferedInputStream(is, 65536))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                Path target = destDir.resolve(entry.getName()).normalize();
                if (!target.startsWith(destDir)) throw new IOException("Zip path traversal");
                if (entry.isDirectory()) { Files.createDirectories(target); }
                else {
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

    private void ensureSqliteFile(Path dbPath) throws IOException {
        byte[] header = new byte[16];
        try (InputStream is = Files.newInputStream(dbPath)) {
            if (is.read(header) < 16) return;
        }
        if (!new String(Arrays.copyOf(header, 15)).equals("SQLite format 3")) {
            Path tmp = dbPath.resolveSibling(dbPath.getFileName() + ".tmp");
            try {
                byte[] buf = new byte[8192];
                try (InputStream fis = new BufferedInputStream(Files.newInputStream(dbPath));
                     InflaterInputStream iis = new InflaterInputStream(fis);
                     OutputStream out = new BufferedOutputStream(Files.newOutputStream(tmp))) {
                    int n; while ((n = iis.read(buf)) != -1) out.write(buf, 0, n);
                }
                Files.move(tmp, dbPath, StandardCopyOption.REPLACE_EXISTING);
            } catch (Exception e) {
                if (Files.exists(tmp)) Files.delete(tmp);
            }
        }
    }

    private Path findDatabase(Path tempDir) throws IOException {
        for (String name : List.of("collection.anki21", "collection.anki2")) {
            Path p = tempDir.resolve(name);
            if (Files.exists(p)) return p;
        }
        try (var stream = Files.walk(tempDir)) {
            return stream.filter(p -> p.getFileName().toString().matches(".*\\.anki2[1]?"))
                    .findFirst().orElseThrow(() -> new IOException("Banco não encontrado no .apkg"));
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, String> readMediaMap(Path tempDir) throws IOException {
        Path mediaFile = tempDir.resolve("media");
        if (!Files.exists(mediaFile)) return Collections.emptyMap();
        return objectMapper.readValue(mediaFile.toFile(), Map.class);
    }

    private String stripHtml(String html) {
        if (html == null) return "";
        return html.replaceAll("<br\\s*/?>", "\n").replaceAll("<[^>]+>", "")
                .replaceAll("&nbsp;", " ").replaceAll("&lt;", "<").replaceAll("&gt;", ">")
                .replaceAll("&amp;", "&").replaceAll("&quot;", "\"")
                .replaceAll("\\s+", " ").trim();
    }

    private String detectMime(String f) {
        String l = f.toLowerCase();
        if (l.endsWith(".jpg") || l.endsWith(".jpeg")) return "image/jpeg";
        if (l.endsWith(".png"))  return "image/png";
        if (l.endsWith(".gif"))  return "image/gif";
        if (l.endsWith(".webp")) return "image/webp";
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
            if (dir == null || !Files.exists(dir)) return;
            Files.walk(dir).sorted(Comparator.reverseOrder()).map(Path::toFile).forEach(File::delete);
        } catch (IOException ignored) {}
    }

    private static boolean isBlank(String s) { return s == null || s.isBlank(); }

    // ── Records internos ──────────────────────────────────────────────────────

    private record AnkiDeckInfo(long id, String name) {}
    private record CardRow(long deckId, String front, String back) {}
    private record FolderResult(Folder folder, int created) {}
    private record ImageProcessResult(String text, List<String> imageUrls, int uploadCount) {}
}