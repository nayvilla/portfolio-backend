-- Migration: Add missing columns and tables
-- Run with: npx wrangler d1 execute portfolio-database --remote --file=./migrations/001_add_missing_columns.sql

-- =========================================================
-- TECHNOLOGIES: Add new columns
-- =========================================================
ALTER TABLE technologies ADD COLUMN icon_url TEXT;
ALTER TABLE technologies ADD COLUMN category TEXT NOT NULL DEFAULT 'other';
ALTER TABLE technologies ADD COLUMN proficiency_level INTEGER DEFAULT 0;
ALTER TABLE technologies ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

-- Copy icon_name to icon_url if exists
UPDATE technologies SET icon_url = icon_name WHERE icon_name IS NOT NULL;

-- =========================================================
-- PROJECTS: Add soft delete column
-- =========================================================
ALTER TABLE projects ADD COLUMN deleted_at TEXT;

-- =========================================================
-- CONTACT_MESSAGES: Add new columns
-- =========================================================
ALTER TABLE contact_messages ADD COLUMN status TEXT NOT NULL DEFAULT 'unread';
ALTER TABLE contact_messages ADD COLUMN ip_hash TEXT;
ALTER TABLE contact_messages ADD COLUMN user_agent TEXT;
ALTER TABLE contact_messages ADD COLUMN read_at TEXT;
ALTER TABLE contact_messages ADD COLUMN replied_at TEXT;

-- Migrate is_read to status
UPDATE contact_messages SET status = 'read' WHERE is_read = 1;

-- =========================================================
-- ADMIN_USERS: Add missing columns
-- =========================================================
ALTER TABLE admin_users ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE admin_users ADD COLUMN locked_until TEXT;

-- =========================================================
-- NEW TABLE: audit_logs
-- =========================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  old_values TEXT,
  new_values TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- =========================================================
-- NEW TABLE: failed_login_attempts
-- =========================================================
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  email TEXT,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- NEW INDEXES
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_technologies_category ON technologies(category);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_ip_hash ON contact_messages(ip_hash);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_ip ON failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_created_at ON failed_login_attempts(created_at);
