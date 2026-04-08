// Tipos para el módulo de auditoría

export type AuditAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'publish'
  | 'archive'
  | 'restore'
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'password_change'
  | 'settings_update';

export type EntityType = 
  | 'project'
  | 'technology'
  | 'contact_message'
  | 'site_setting'
  | 'admin_user'
  | 'analytics';

export interface AuditLog {
  id: number;
  user_id: number | null;
  action: AuditAction;
  entity_type: EntityType;
  entity_id: number | null;
  old_values: string | null;
  new_values: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface FailedLoginAttempt {
  id: number;
  username: string | null;
  email: string | null;
  ip_address: string;
  user_agent: string | null;
  reason: string | null;
  created_at: string;
}

export interface CreateAuditInput {
  userId?: number | null;
  action: AuditAction;
  entityType: EntityType;
  entityId?: number | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuditListOptions {
  page: number;
  limit: number;
  userId?: number;
  action?: AuditAction;
  entityType?: EntityType;
  startDate?: string;
  endDate?: string;
}
