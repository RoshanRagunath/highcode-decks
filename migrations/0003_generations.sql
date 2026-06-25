-- Generation history: one row per generation attempt that passed validation, so an
-- admin can see what was uploaded by whom. User identity is snapshotted (username +
-- display name) so the log survives a later user delete; user_id is kept for joins
-- but is not enforced (D1 doesn't enforce FKs) and may point at a deleted user.
CREATE TABLE IF NOT EXISTS generations (
  id          TEXT PRIMARY KEY,
  user_id     TEXT,
  username    TEXT NOT NULL,
  user_name   TEXT NOT NULL,
  kind        TEXT NOT NULL,            -- 'file' | 'prompt'
  file_name   TEXT,                     -- original upload name (NULL for prompt-only)
  file_type   TEXT,                     -- MIME type (NULL for prompt-only)
  file_size   INTEGER,                  -- bytes (NULL for prompt-only)
  prompt_excerpt TEXT,                  -- first chars of a text prompt (NULL for file)
  theme_id    TEXT,                     -- effective Gamma theme used
  status      TEXT NOT NULL,            -- 'ok' | 'error'
  error       TEXT,                     -- short message when status = 'error'
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations (created_at DESC);
