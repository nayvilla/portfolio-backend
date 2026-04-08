import { Env } from '../../shared/types';
import { successResponse, errorResponse } from '../../shared/utils/response';
import { requireAuth } from '../../shared/middlewares/auth.middleware';
import { getClientIP } from '../../shared/middlewares/rate-limit.middleware';
import { AnalyticsService } from './analytics.service';
import { TrackEventInput, validateTrackEvent, validateDateRange } from './analytics.validator';

export class AnalyticsController {
  private service: AnalyticsService;

  constructor(private env: Env) {
    this.service = new AnalyticsService(env);
  }

  // ========== PUBLIC ==========

  async track(request: Request): Promise<Response> {
    try {
      const data = await request.json() as TrackEventInput;
      const errors = validateTrackEvent(data);
      if (errors.length > 0) {
        return errorResponse(errors[0].message);
      }

      const ip = getClientIP(request);
      const userAgent = request.headers.get('User-Agent') || undefined;

      const id = await this.service.track(data, ip, userAgent);
      return successResponse({ tracked: true, id }, '', 201);
    } catch (error) {
      return errorResponse('Error al registrar evento', 500);
    }
  }

  // ========== ADMIN ==========

  async list(request: Request): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const url = new URL(request.url);
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
      const limit = Math.min(100, parseInt(url.searchParams.get('limit') || '20'));
      const eventType = url.searchParams.get('event_type') || undefined;
      const startDate = url.searchParams.get('start_date') || undefined;
      const endDate = url.searchParams.get('end_date') || undefined;

      const dateErrors = validateDateRange(startDate, endDate);
      if (dateErrors.length > 0) {
        return errorResponse(dateErrors[0].message);
      }

      const result = await this.service.list({ page, limit, eventType, startDate, endDate });
      return successResponse(result);
    } catch (error) {
      return errorResponse('Error al obtener eventos', 500);
    }
  }

  async getSummary(request: Request): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const url = new URL(request.url);
      const startDate = url.searchParams.get('start_date') || undefined;
      const endDate = url.searchParams.get('end_date') || undefined;

      const dateErrors = validateDateRange(startDate, endDate);
      if (dateErrors.length > 0) {
        return errorResponse(dateErrors[0].message);
      }

      const summary = await this.service.getSummary(startDate, endDate);
      return successResponse(summary);
    } catch (error) {
      return errorResponse('Error al obtener resumen', 500);
    }
  }

  async delete(request: Request, id: number): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const deleted = await this.service.delete(id);
      if (!deleted) {
        return errorResponse('Evento no encontrado', 404);
      }
      return successResponse({ deleted: true }, 'Evento eliminado exitosamente');
    } catch (error) {
      return errorResponse('Error al eliminar evento', 500);
    }
  }

  async cleanup(request: Request): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const data = await request.json() as { days?: number };
      const days = data.days || 90; // Default: 90 días

      if (days < 7 || days > 365) {
        return errorResponse('days debe estar entre 7 y 365');
      }

      const deleted = await this.service.cleanup(days);
      return successResponse({ deleted }, `${deleted} eventos antiguos eliminados`);
    } catch (error) {
      return errorResponse('Error al limpiar eventos', 500);
    }
  }

  async getEventTypes(request: Request): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const types = await this.service.getEventTypes();
      return successResponse(types);
    } catch (error) {
      return errorResponse('Error al obtener tipos de evento', 500);
    }
  }
}
