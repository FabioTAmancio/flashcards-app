CREATE TABLE folders (
                         id          BIGSERIAL PRIMARY KEY,
                         name        VARCHAR(255) NOT NULL,
                         user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                         parent_id   BIGINT REFERENCES folders(id) ON DELETE CASCADE,
                         created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
                         CONSTRAINT folders_no_self_ref CHECK (id != parent_id)
);

CREATE INDEX idx_folders_user    ON folders(user_id);
CREATE INDEX idx_folders_parent  ON folders(parent_id);

ALTER TABLE decks ADD COLUMN folder_id BIGINT REFERENCES folders(id) ON DELETE SET NULL;

CREATE INDEX idx_decks_folder ON decks(folder_id);
