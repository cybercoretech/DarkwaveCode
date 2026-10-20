PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  google_sub TEXT UNIQUE,
  email TEXT UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  password_salt TEXT,
  password_hash TEXT,
  handle TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  favorite_language TEXT NOT NULL DEFAULT 'JavaScript',
  experience_level TEXT NOT NULL DEFAULT 'curious',
  avatar_kind TEXT NOT NULL DEFAULT 'emoji',
  avatar_value TEXT NOT NULL DEFAULT '👾',
  avatar_image TEXT NOT NULL DEFAULT '',
  theme TEXT NOT NULL DEFAULT 'cyberpunk/cyberpunk-neon',
  profile_visibility TEXT NOT NULL DEFAULT 'public',
  show_activity INTEGER NOT NULL DEFAULT 1,
  email_product_updates INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS oauth_states (
  state_hash TEXT PRIMARY KEY,
  verifier TEXT NOT NULL,
  return_to TEXT NOT NULL,
  link_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS email_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('verify', 'reset')),
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS email_tokens_user ON email_tokens(user_id, purpose);

CREATE TABLE IF NOT EXISTS auth_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  window_started INTEGER NOT NULL
);
