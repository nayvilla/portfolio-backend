import { Env } from '../../shared/types';
import { successResponse, codeError, ErrorCodes } from '../../shared/utils/response';
import { requireAuth } from '../../shared/middlewares/auth.middleware';
import { AuditService } from './audit.service';
import { AuditAction, EntityType } from './audit.types';

export class AuditController {
  private service: AuditService;

  constructor(private env: Env) {
    this.service = new AuditService(env);
  }

  // GET /api/admin/audit
  async list(request: Request): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const url = new URL(request.url);
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
      const limit = Math.min(100, parseInt(url.searchParams.get('limit') || '50'));
      const userId = url.searchParams.get('user_id') ? parseInt(url.searchParams.get('user_id')!) : undefined;
      const action = url.searchParams.get('action') as AuditAction | undefined;
      const entityType = url.searchParams.get('entity_type') as EntityType | undefined;
      const startDate = url.searchParams.get('start_date') || undefined;
      const endDate = url.searchParams.get('end_date') || undefined;

      const result = await this.service.list({ 
        page, 
        limit, 
        userId, 
        action, 
        entityType,
        startDate,
        endDate,
      });
      return successResponse(result);
    } catch (error) {
      return codeError(ErrorCodes.INTERNAL_ERROR);
    }
  }

  // GET /api/admin/audit/:id
  async getById(request: Request, id: number): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const log = await this.service.getById(id);
      if (!log) {
        return codeError(ErrorCodes.NOT_FOUND, 'Registro de auditoría no encontrado');
      }
      return successResponse(log);
    } catch (error) {
      return codeError(ErrorCodes.INTERNAL_ERROR);
    }
  }

  // GET /api/admin/audit/entity/:type/:id
  async getEntityHistory(request: Request, entityType: string, entityId: number): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const validTypes = ['project', 'technology', 'contact_message', 'site_setting', 'admin_user'];
      if (!validTypes.includes(entityType)) {
        return codeError(ErrorCodes.BAD_REQUEST, 'Tipo de entidad inválido');
      }

      const logs = await this.service.getEntityHistory(entityType as EntityType, entityId);
      return successResponse(logs);
    } catch (error) {
      return codeError(ErrorCodes.INTERNAL_ERROR);
    }
  }

  // GET /api/admin/audit/failed-logins
  async listFailedLogins(request: Request): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const url = new URL(request.url);
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
      const limit = Math.min(100, parseInt(url.searchParams.get('limit') || '50'));
      const ipAddress = url.searchParams.get('ip') || undefined;

      const result = await this.service.listFailedLogins({ page, limit, ipAddress });
      return successResponse(result);
    } catch (error) {
      return codeError(ErrorCodes.INTERNAL_ERROR);
    }
  }

  // GET /api/admin/audit/stats
  async getStats(request: Request): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const url = new URL(request.url);
      const days = Math.min(365, parseInt(url.searchParams.get('days') || '30'));

      const stats = await this.service.getStats(days);
      return successResponse(stats);
    } catch (error) {
      return codeError(ErrorCodes.INTERNAL_ERROR);
    }
  }

  // DELETE /api/admin/audit/cleanup
  async cleanup(request: Request): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const url = new URL(request.url);
      const auditDays = Math.max(30, parseInt(url.searchParams.get('audit_days') || '90'));
      const failedLoginDays = Math.max(7, parseInt(url.searchParams.get('failed_login_days') || '30'));

      const result = await this.service.cleanup(auditDays, failedLoginDays);
      
      // Log the cleanup action itself
      await this.service.logFromRequest(
        request,
        auth.user.id,
        'delete',
        'analytics',
        undefined,
        undefined,
        { auditDays, failedLoginDays, ...result }
      );

      return successResponse(result, 'Limpieza completada');
    } catch (error) {
      return codeError(ErrorCodes.INTERNAL_ERROR);
    }
  }
}
