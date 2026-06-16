-- User groups: a group carries a shared Gamma theme_id that its members inherit.
-- A user's per-user theme_id (added in 0001) becomes an optional override:
-- the effective theme is COALESCE(users.theme_id, groups.theme_id), resolved in app code.
CREATE TABLE IF NOT EXISTS groups (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  theme_id   TEXT,
  created_at INTEGER NOT NULL
);

-- Optional membership. NULL = no group (user relies solely on their own theme_id).
-- FKs are not enforced by D1 unless PRAGMA foreign_keys=ON, so group-delete integrity
-- (nulling members) is handled in src/lib/users.ts deleteGroup(), not relied on here.
ALTER TABLE users ADD COLUMN group_id TEXT REFERENCES groups(id);
