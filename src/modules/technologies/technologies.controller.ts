import { Env } from '../../shared/types';
import { successResponse, errorResponse } from '../../shared/utils/response';
import { requireAuth } from '../../shared/middlewares/auth.middleware';
import { TechnologiesService } from './technologies.service';
import { CreateTechnologyInput, UpdateTechnologyInput, validateCreateTechnology, validateUpdateTechnology } from './technologies.validator';

export class TechnologiesController {
  private service: TechnologiesService;

  constructor(private env: Env) {
    this.service = new TechnologiesService(env);
  }

  // ========== PUBLIC ==========

  async list(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const category = url.searchParams.get('category') || undefined;

      const technologies = await this.service.list(category);
      return successResponse(technologies);
    } catch (error) {
      return errorResponse('Error al obtener tecnologías', 500);
    }
  }

  async getBySlug(request: Request, slug: string): Promise<Response> {
    try {
      const tech = await this.service.getBySlug(slug);
      if (!tech) {
        return errorResponse('Tecnología no encontrada', 404);
      }
      return successResponse(tech);
    } catch (error) {
      return errorResponse('Error al obtener tecnología', 500);
    }
  }

  async getCategories(request: Request): Promise<Response> {
    try {
      const categories = await this.service.getCategories();
      return successResponse(categories);
    } catch (error) {
      return errorResponse('Error al obtener categorías', 500);
    }
  }

  // ========== ADMIN ==========

  async create(request: Request): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const data = await request.json() as CreateTechnologyInput;
      const errors = validateCreateTechnology(data);
      if (errors.length > 0) {
        return errorResponse(errors[0].message);
      }

      const result = await this.service.create(data);
      return successResponse(result, 'Tecnología creada exitosamente', 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear tecnología';
      return errorResponse(message, message.includes('existe') ? 409 : 500);
    }
  }

  async update(request: Request, id: number): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const data = await request.json() as UpdateTechnologyInput;
      const errors = validateUpdateTechnology(data);
      if (errors.length > 0) {
        return errorResponse(errors[0].message);
      }

      const updated = await this.service.update(id, data);
      if (!updated) {
        return errorResponse('No se pudo actualizar la tecnología');
      }

      return successResponse({ updated: true }, 'Tecnología actualizada exitosamente');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar';
      return errorResponse(message, message.includes('no encontrada') ? 404 : 500);
    }
  }

  async delete(request: Request, id: number): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const deleted = await this.service.delete(id);
      if (!deleted) {
        return errorResponse('Tecnología no encontrada', 404);
      }
      return successResponse({ deleted: true }, 'Tecnología eliminada exitosamente');
    } catch (error) {
      return errorResponse('Error al eliminar tecnología', 500);
    }
  }
}
