-- Portfolio Backend Database Schema
-- Cloudflare D1 (SQLite)
-- Version: 2.0

PRAGMA foreign_keys = ON;

-- =========================================================
-- TABLE: admin_users
-- =========================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  last_login_at TEXT,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TABLE: site_settings
-- =========================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  value_type TEXT NOT NULL DEFAULT 'string' CHECK (value_type IN ('string', 'number', 'boolean', 'json')),
  setting_group TEXT NOT NULL DEFAULT 'general',
  is_public INTEGER NOT NULL DEFAULT 0 CHECK (is_public IN (0,1)),
  description TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TABLE: technologies
-- =========================================================
CREATE TABLE IF NOT EXISTS technologies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon_url TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  proficiency_level INTEGER DEFAULT 0 CHECK (proficiency_level >= 0 AND proficiency_level <= 100),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TABLE: projects
-- =========================================================
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  full_description TEXT,
  role TEXT,
  category TEXT NOT NULL DEFAULT 'web',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  cover_image_url TEXT,
  demo_url TEXT,
  repository_url TEXT,
  is_featured INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  deleted_at TEXT,  -- Soft delete
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TABLE: project_images
-- =========================================================
CREATE TABLE IF NOT EXISTS project_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- =========================================================
-- TABLE: project_links
-- =========================================================
CREATE TABLE IF NOT EXISTS project_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  link_type TEXT NOT NULL CHECK (link_type IN ('demo', 'github', 'figma', 'docs', 'video', 'other')),
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- =========================================================
-- TABLE: project_technologies
-- =========================================================
CREATE TABLE IF NOT EXISTS project_technologies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  technology_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (technology_id) REFERENCES technologies(id) ON DELETE CASCADE,
  UNIQUE (project_id, technology_id)
);

-- =========================================================
-- TABLE: project_likes
-- =========================================================
CREATE TABLE IF NOT EXISTS project_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  visitor_hash TEXT NOT NULL,
  ip_hash TEXT,
  user_agent_hash TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE (project_id, visitor_hash)
);

-- =========================================================
-- TABLE: contact_messages
-- =========================================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  purpose TEXT CHECK (purpose IS NULL OR purpose IN ('freelance', 'job_offer', 'question', 'collaboration', 'other')),
  source TEXT NOT NULL DEFAULT 'website',
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived', 'spam')),
  ip_hash TEXT,
  user_agent TEXT,
  read_at TEXT,
  replied_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TABLE: contact_notifications
-- =========================================================
CREATE TABLE IF NOT EXISTS contact_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'telegram', 'discord', 'webhook')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  response_data TEXT,
  sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES contact_messages(id) ON DELETE CASCADE
);

-- =========================================================
-- TABLE: analytics_events
-- =========================================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'page_view',
      'project_view',
      'project_like',
      'link_click',
      'contact_submit',
      'download',
      'search',
      'custom'
    )
  ),
  project_id INTEGER,
  page_path TEXT,
  visitor_hash TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- =========================================================
-- TABLE: audit_logs (Nueva tabla de auditoría)
-- =========================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  old_values TEXT,  -- JSON con valores anteriores
  new_values TEXT,  -- JSON con valores nuevos
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- =========================================================
-- TABLE: failed_login_attempts (Intentos fallidos)
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
-- INDEXES
-- =========================================================

-- admin_users
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- technologies
CREATE INDEX IF NOT EXISTS idx_technologies_slug ON technologies(slug);
CREATE INDEX IF NOT EXISTS idx_technologies_category ON technologies(category);

-- projects
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_is_featured ON projects(is_featured);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);

-- project_images
CREATE INDEX IF NOT EXISTS idx_project_images_project_id ON project_images(project_id);

-- project_links
CREATE INDEX IF NOT EXISTS idx_project_links_project_id ON project_links(project_id);

-- project_technologies
CREATE INDEX IF NOT EXISTS idx_project_technologies_project_id ON project_technologies(project_id);
CREATE INDEX IF NOT EXISTS idx_project_technologies_technology_id ON project_technologies(technology_id);

-- project_likes
CREATE INDEX IF NOT EXISTS idx_project_likes_project_id ON project_likes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_likes_visitor_hash ON project_likes(visitor_hash);

-- contact_messages
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_messages_ip_hash ON contact_messages(ip_hash);

-- contact_notifications
CREATE INDEX IF NOT EXISTS idx_contact_notifications_message_id ON contact_notifications(message_id);
CREATE INDEX IF NOT EXISTS idx_contact_notifications_status ON contact_notifications(status);

-- analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_project_id ON analytics_events(project_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- failed_login_attempts
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_ip ON failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_created_at ON failed_login_attempts(created_at);

-- =========================================================
-- INITIAL DATA (Optional)
-- =========================================================

-- Default site settings
INSERT OR IGNORE INTO site_settings (setting_key, setting_value, value_type, setting_group, is_public, description)
VALUES 
  ('site_title', 'Mi Portafolio', 'string', 'general', 1, 'Título del sitio'),
  ('site_description', 'Desarrollador Full Stack', 'string', 'general', 1, 'Descripción del sitio'),
  ('contact_email', 'contact@example.com', 'string', 'contact', 1, 'Email de contacto público'),
  ('github_url', '', 'string', 'social', 1, 'URL de GitHub'),
  ('linkedin_url', '', 'string', 'social', 1, 'URL de LinkedIn'),
  ('twitter_url', '', 'string', 'social', 1, 'URL de Twitter/X'),
  ('analytics_enabled', 'true', 'boolean', 'analytics', 0, 'Habilitar analíticas'),
  ('notification_email_enabled', 'false', 'boolean', 'notifications', 0, 'Notificaciones por email'),
  ('notification_telegram_enabled', 'false', 'boolean', 'notifications', 0, 'Notificaciones por Telegram'),
  ('notification_discord_enabled', 'false', 'boolean', 'notifications', 0, 'Notificaciones por Discord');
