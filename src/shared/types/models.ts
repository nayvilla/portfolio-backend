// =========================================================
// MODELOS - Interfaces de las tablas de la base de datos
// =========================================================

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface SiteSetting {
  id: number;
  setting_key: string;
  setting_value: string | null;
  value_type: string;
  setting_group: string;
  updated_at: string;
}

export interface Technology {
  id: number;
  name: string;
  slug: string;
  icon_url: string | null;
  category: string;
  proficiency_level: number;
  sort_order: number;
  created_at: string;
}

export interface Project {
  id: number;
  slug: string;
  title: string;
  short_description: string;
  full_description: string | null;
  role: string | null;
  category: string;
  status: 'draft' | 'published' | 'archived';
  cover_image_url: string | null;
  demo_url: string | null;
  repository_url: string | null;
  is_featured: number;
  sort_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectImage {
  id: number;
  project_id: number;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
}

export interface ProjectLink {
  id: number;
  project_id: number;
  link_type: 'demo' | 'github' | 'figma' | 'docs' | 'video' | 'other';
  label: string;
  url: string;
  sort_order: number;
  created_at: string;
}

export interface ProjectTechnology {
  id: number;
  project_id: number;
  technology_id: number;
  created_at: string;
}

export interface ProjectLike {
  id: number;
  project_id: number;
  visitor_hash: string;
  ip_hash: string | null;
  user_agent_hash: string | null;
  created_at: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  purpose: 'freelance' | 'job_offer' | 'question' | 'collaboration' | 'other' | null;
  source: string;
  status: 'unread' | 'read' | 'replied' | 'archived' | 'spam';
  ip_hash: string | null;
  user_agent: string | null;
  read_at: string | null;
  created_at: string;
}

export interface ContactNotification {
  id: number;
  message_id: number;
  channel: 'email' | 'telegram' | 'discord' | 'webhook';
  status: 'pending' | 'sent' | 'failed';
  response_text: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface AnalyticsEvent {
  id: number;
  event_type: 'project_view' | 'project_like' | 'whatsapp_click' | 'email_click' | 'demo_click' | 'github_click' | 'contact_submit';
  project_id: number | null;
  visitor_hash: string | null;
  metadata_json: string | null;
  created_at: string;
}
