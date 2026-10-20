PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  updated_by TEXT NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS user_bans (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  banned_until INTEGER,
  reason TEXT NOT NULL DEFAULT '',
  actor_id TEXT NOT NULL REFERENCES users(id),
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS user_bans_expiry ON user_bans(banned_until);

CREATE TABLE IF NOT EXISTS admin_audit (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS admin_audit_created ON admin_audit(created_at);

CREATE TABLE IF NOT EXISTS telemetry_daily (
  day TEXT NOT NULL,
  event TEXT NOT NULL CHECK (event IN ('page','run','course_complete')),
  label TEXT NOT NULL,
  event_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  duration_total INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(day,event,label)
);
CREATE INDEX IF NOT EXISTS telemetry_event_day ON telemetry_daily(event,day);

CREATE TABLE IF NOT EXISTS discussion_threads (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES users(id),
  category TEXT NOT NULL CHECK (category IN ('general','help','showcase','courses','workbench')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  is_hidden INTEGER NOT NULL DEFAULT 0,
  is_locked INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS discussion_threads_recent ON discussion_threads(is_hidden,updated_at DESC);

CREATE TABLE IF NOT EXISTS discussion_replies (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES discussion_threads(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  is_hidden INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS discussion_replies_thread ON discussion_replies(thread_id,created_at);

CREATE TABLE IF NOT EXISTS discussion_reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL REFERENCES users(id),
  thread_id TEXT REFERENCES discussion_threads(id) ON DELETE CASCADE,
  reply_id TEXT REFERENCES discussion_replies(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  created_at INTEGER NOT NULL,
  CHECK ((thread_id IS NOT NULL AND reply_id IS NULL) OR (thread_id IS NULL AND reply_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS discussion_reports_status ON discussion_reports(status,created_at DESC);
