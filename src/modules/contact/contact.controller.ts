import { Env } from '../../shared/types';
import { successResponse, errorResponse } from '../../shared/utils/response';
import { requireAuth } from '../../shared/middlewares/auth.middleware';
import { getClientIP } from '../../shared/middlewares/rate-limit.middleware';
import { ContactService } from './contact.service';
import { CreateContactInput, validateContactMessage, validateStatusUpdate } from './contact.validator';

export class ContactController {
  private service: ContactService;

  constructor(private env: Env) {
    this.service = new ContactService(env);
  }

  // ========== PUBLIC ==========

  async submit(request: Request): Promise<Response> {
    try {
      const data = await request.json() as CreateContactInput;
      const errors = validateContactMessage(data);
      if (errors.length > 0) {
        return errorResponse(errors[0].message);
      }

      const ip = getClientIP(request);
      const userAgent = request.headers.get('User-Agent') || undefined;

      const result = await this.service.create(data, ip, userAgent);

      if (result.rateLimit) {
        return errorResponse('Has enviado demasiados mensajes. Intenta más tarde.', 429);
      }

      return successResponse(
        { id: result.id },
        'Mensaje enviado exitosamente. Te responderemos pronto.',
        201
      );
    } catch (error) {
      return errorResponse('Error al enviar mensaje', 500);
    }
  }

  // ========== ADMIN ==========

  async list(request: Request): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const url = new URL(request.url);
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
      const limit = Math.min(50, parseInt(url.searchParams.get('limit') || '10'));
      const status = url.searchParams.get('status') || undefined;

      const result = await this.service.list({ page, limit, status });
      return successResponse(result);
    } catch (error) {
      return errorResponse('Error al obtener mensajes', 500);
    }
  }

  async getById(request: Request, id: number): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const message = await this.service.getById(id);
      if (!message) {
        return errorResponse('Mensaje no encontrado', 404);
      }

      // Marcar como leído automáticamente
      if (message.status === 'unread') {
        await this.service.markAsRead(id);
      }

      return successResponse(message);
    } catch (error) {
      return errorResponse('Error al obtener mensaje', 500);
    }
  }

  async updateStatus(request: Request, id: number): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const data = await request.json() as { status?: string };
      if (!data.status) {
        return errorResponse('status requerido');
      }

      const errors = validateStatusUpdate(data.status);
      if (errors.length > 0) {
        return errorResponse(errors[0].message);
      }

      const updated = await this.service.updateStatus(id, data.status);
      if (!updated) {
        return errorResponse('No se pudo actualizar el estado');
      }

      return successResponse({ updated: true }, 'Estado actualizado exitosamente');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar';
      return errorResponse(message, message.includes('no encontrado') ? 404 : 500);
    }
  }

  async delete(request: Request, id: number): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const deleted = await this.service.delete(id);
      if (!deleted) {
        return errorResponse('Mensaje no encontrado', 404);
      }
      return successResponse({ deleted: true }, 'Mensaje eliminado exitosamente');
    } catch (error) {
      return errorResponse('Error al eliminar mensaje', 500);
    }
  }

  async getUnreadCount(request: Request): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const count = await this.service.getUnreadCount();
      return successResponse({ unread: count });
    } catch (error) {
      return errorResponse('Error al obtener conteo', 500);
    }
  }
}
