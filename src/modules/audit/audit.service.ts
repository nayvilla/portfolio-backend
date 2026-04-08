import { Env, PaginatedResponse } from '../../shared/types';
import { AuditRepository } from './audit.repository';
import { AuditLog, FailedLoginAttempt, CreateAuditInput, AuditListOptions, AuditAction, EntityType } from './audit.types';

export class AuditService {
  private repository: AuditRepository;

  constructor(private env: Env) {
    this.repository = new AuditRepository(env.portfolio_database);
  }

  // Registrar acción de auditoría
  async log(input: CreateAuditInput): Promise<number> {
    return this.repository.create(input);
  }

  // Helper para logging desde request
  async logFromRequest(
    request: Request,
    userId: number | null,
    action: AuditAction,
    entityType: EntityType,
    entityId?: number,
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>
  ): Promise<number> {
    const ipAddress = request.headers.get('CF-Connecting-IP') 
      || request.headers.get('X-Forwarded-For')?.split(',')[0] 
      || 'unknown';
    const userAgent = request.headers.get('User-Agent') || undefined;

    return this.repository.create({
      userId,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
    });
  }

  // Listar logs de auditoría
  async list(options: AuditListOptions): Promise<PaginatedResponse<AuditLog>> {
    const [logs, total] = await Promise.all([
      this.repository.findAll(options),
      this.repository.countAll(options),
    ]);

    return {
      data: logs,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  // Obtener log por ID
  async getById(id: number): Promise<AuditLog | null> {
    return this.repository.findById(id);
  }

  // Obtener historial de una entidad
  async getEntityHistory(entityType: EntityType, entityId: number): Promise<AuditLog[]> {
    return this.repository.findByEntity(entityType, entityId);
  }

  // Registrar intento de login fallido
  async logFailedLogin(
    request: Request,
    username?: string,
    email?: string,
    reason?: string
  ): Promise<number> {
    const ipAddress = request.headers.get('CF-Connecting-IP') 
      || request.headers.get('X-Forwarded-For')?.split(',')[0] 
      || 'unknown';
    const userAgent = request.headers.get('User-Agent') || undefined;

    return this.repository.createFailedLogin({
      username,
      email,
      ipAddress,
      userAgent,
      reason,
    });
  }

  // Verificar si IP tiene muchos intentos fallidos (para bloqueo temporal)
  async checkFailedAttempts(request: Request, maxAttempts: number = 5, windowMinutes: number = 15): Promise<boolean> {
    const ipAddress = request.headers.get('CF-Connecting-IP') 
      || request.headers.get('X-Forwarded-For')?.split(',')[0] 
      || 'unknown';

    const attempts = await this.repository.getRecentFailedAttempts(ipAddress, windowMinutes);
    return attempts >= maxAttempts;
  }

  // Listar intentos de login fallidos
  async listFailedLogins(options: { page: number; limit: number; ipAddress?: string }): Promise<PaginatedResponse<FailedLoginAttempt>> {
    const logs = await this.repository.getFailedLoginList(options);
    
    // Simplificado - en producción deberías contar para paginación real
    return {
      data: logs,
      pagination: {
        page: options.page,
        limit: options.limit,
        total: logs.length,
        totalPages: 1,
      },
    };
  }

  // Limpiar logs antiguos
  async cleanup(auditLogDays: number = 90, failedLoginDays: number = 30): Promise<{ auditDeleted: number; failedDeleted: number }> {
    const [auditDeleted, failedDeleted] = await Promise.all([
      this.repository.cleanup(auditLogDays),
      this.repository.cleanupFailedLogins(failedLoginDays),
    ]);

    return { auditDeleted, failedDeleted };
  }

  // Obtener estadísticas
  async getStats(days: number = 30) {
    return this.repository.getStats(days);
  }
}

// Singleton helper para usar en otros módulos
let auditServiceInstance: AuditService | null = null;

export function getAuditService(env: Env): AuditService {
  if (!auditServiceInstance) {
    auditServiceInstance = new AuditService(env);
  }
  return auditServiceInstance;
}
