-- =========================
-- USERS
-- =========================
CREATE TABLE users (
                       id BIGSERIAL PRIMARY KEY,
                       name VARCHAR(150) NOT NULL,
                       email VARCHAR(150) UNIQUE NOT NULL,
                       password VARCHAR(255) NOT NULL,
                       role VARCHAR(50) NOT NULL
);

-- =========================
-- DECKS
-- =========================
CREATE TABLE decks (
                       id BIGSERIAL PRIMARY KEY,

                       name VARCHAR(150) NOT NULL,
                       description TEXT,
                       color VARCHAR(50),

                       subject VARCHAR(100),

                       is_public BOOLEAN DEFAULT FALSE,

                       user_id BIGINT NOT NULL,

                       CONSTRAINT fk_deck_user
                           FOREIGN KEY (user_id)
                               REFERENCES users(id)
                               ON DELETE CASCADE
);

-- =========================
-- FLASHCARDS
-- =========================
CREATE TABLE flashcards (
                            id BIGSERIAL PRIMARY KEY,

                            front TEXT NOT NULL,
                            back TEXT NOT NULL,

                            subject VARCHAR(100) NOT NULL,

                            user_id BIGINT NOT NULL,
                            deck_id BIGINT NOT NULL,

                            CONSTRAINT fk_flashcard_user
                                FOREIGN KEY (user_id)
                                    REFERENCES users(id)
                                    ON DELETE CASCADE,

                            CONSTRAINT fk_flashcard_deck
                                FOREIGN KEY (deck_id)
                                    REFERENCES decks(id)
                                    ON DELETE CASCADE
);

-- =========================
-- FLASHCARD PROGRESS (SRS)
-- =========================
CREATE TABLE flashcard_progress (
                                    id BIGSERIAL PRIMARY KEY,

                                    user_id BIGINT NOT NULL,
                                    flashcard_id BIGINT NOT NULL,

                                    interval INTEGER DEFAULT 1,
                                    ease_factor DOUBLE PRECISION DEFAULT 2.5,
                                    repetitions INTEGER DEFAULT 0,

                                    next_review DATE NOT NULL,

                                    CONSTRAINT fk_progress_user
                                        FOREIGN KEY (user_id)
                                            REFERENCES users(id)
                                            ON DELETE CASCADE,

                                    CONSTRAINT fk_progress_flashcard
                                        FOREIGN KEY (flashcard_id)
                                            REFERENCES flashcards(id)
                                            ON DELETE CASCADE,

    -- 🔥 evita duplicar progresso do mesmo usuário no mesmo card
                                    CONSTRAINT unique_user_flashcard
                                        UNIQUE (user_id, flashcard_id)
);