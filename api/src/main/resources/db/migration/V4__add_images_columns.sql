ALTER TABLE flashcards
    ADD COLUMN IF NOT EXISTS front_image_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS back_image_url  VARCHAR(500);