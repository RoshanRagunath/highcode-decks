-- Users for the gamma-generator access gate.
-- Each user has a Gamma theme_id injected into the generation payload.
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  theme_id      TEXT,
  role          TEXT NOT NULL DEFAULT 'user',
  password_hash TEXT NOT NULL,
  created_at    INTEGER NOT NULL
);
