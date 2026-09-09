-- FEMTOLENS D1 schema. Safe to re-run: every statement is IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  google_sub TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  picture TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  tier TEXT NOT NULL DEFAULT 'trial',
  status TEXT NOT NULL DEFAULT 'active',
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  runs_used INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS groq_usage (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  limit_requests INTEGER,
  remaining_requests INTEGER,
  limit_tokens INTEGER,
  remaining_tokens INTEGER,
  reset_requests TEXT,
  reset_tokens TEXT,
  updated_at TEXT
);

INSERT OR IGNORE INTO groq_usage (id) VALUES (1);
