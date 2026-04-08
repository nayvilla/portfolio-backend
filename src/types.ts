// Tipos y interfaces para la aplicación
export interface Env {
  portfolio_database: D1Database;
  JWT_SECRET: string;
}

export interface JWTPayload {
  id: number;
  username: string;
  email: string;
  iat: number;
  exp: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  slug: string;
  title: string;
  short_description: string;
  full_description?: string;
  role?: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  cover_image_url?: string;
  demo_url?: string;
  repository_url?: string;
  is_featured: number;
  sort_order: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  source: string;
  is_read: number;
  created_at: string;
}
