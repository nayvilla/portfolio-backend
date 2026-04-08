import { Env } from '../../shared/types';
import { successResponse, errorResponse } from '../../shared/utils/response';
import { requireAuth } from '../../shared/middlewares/auth.middleware';
import { generateHash } from '../../shared/utils/hash';
import { getClientIP } from '../../shared/middlewares/rate-limit.middleware';
import { ProjectsService } from './projects.service';
import {
  CreateProjectInput,
  UpdateProjectInput,
  validateCreateProject,
  validateUpdateProject,
  validateImageInput,
  validateLinkInput,
} from './projects.validator';

interface ImageInput {
  image_url: string;
  alt_text?: string;
  sort_order?: number;
}

interface LinkInput {
  link_type: string;
  label: string;
  url: string;
  sort_order?: number;
}

export class ProjectsController {
  private service: ProjectsService;

  constructor(private env: Env) {
    this.service = new ProjectsService(env);
  }

  // ========== PROJECTS ==========

  async list(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
      const limit = Math.min(50, parseInt(url.searchParams.get('limit') || '10'));
      const status = url.searchParams.get('status') || 'published';
      const category = url.searchParams.get('category') || undefined;

      const result = await this.service.list({ page, limit, status, category });
      return successResponse(result);
    } catch (error) {
      return errorResponse('Error al obtener proyectos', 500);
    }
  }

  async getBySlug(request: Request, slug: string): Promise<Response> {
    try {
      const project = await this.service.getBySlug(slug);
      if (!project) {
        return errorResponse('Proyecto no encontrado', 404);
      }
      return successResponse(project);
    } catch (error) {
      return errorResponse('Error al obtener proyecto', 500);
    }
  }

  async create(request: Request): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const data = await request.json() as CreateProjectInput;
      const errors = validateCreateProject(data);
      if (errors.length > 0) {
        return errorResponse(errors[0].message);
      }

      const result = await this.service.create(data);
      return successResponse(result, 'Proyecto creado exitosamente', 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear proyecto';
      return errorResponse(message, message.includes('existe') ? 409 : 500);
    }
  }

  async update(request: Request, id: number): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const data = await request.json() as UpdateProjectInput;
      const errors = validateUpdateProject(data);
      if (errors.length > 0) {
        return errorResponse(errors[0].message);
      }

      const updated = await this.service.update(id, data);
      if (!updated) {
        return errorResponse('No se pudo actualizar el proyecto');
      }

      return successResponse({ updated: true }, 'Proyecto actualizado exitosamente');
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
        return errorResponse('Proyecto no encontrado', 404);
      }
      return successResponse({ deleted: true }, 'Proyecto eliminado exitosamente');
    } catch (error) {
      return errorResponse('Error al eliminar proyecto', 500);
    }
  }

  async publish(request: Request, id: number): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const published = await this.service.publish(id);
      if (!published) {
        return errorResponse('Proyecto no encontrado', 404);
      }
      return successResponse({ published: true }, 'Proyecto publicado exitosamente');
    } catch (error) {
      return errorResponse('Error al publicar proyecto', 500);
    }
  }

  // ========== IMAGES ==========

  async addImage(request: Request, projectId: number): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const data = await request.json() as ImageInput;
      const errors = validateImageInput(data);
      if (errors.length > 0) {
        return errorResponse(errors[0].message);
      }

      const imageId = await this.service.addImage(projectId, data.image_url, data.alt_text, data.sort_order);
      return successResponse({ id: imageId }, 'Imagen agregada exitosamente', 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al agregar imagen';
      return errorResponse(message, 500);
    }
  }

  async deleteImage(request: Request, imageId: number): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const deleted = await this.service.deleteImage(imageId);
      if (!deleted) {
        return errorResponse('Imagen no encontrada', 404);
      }
      return successResponse({ deleted: true }, 'Imagen eliminada exitosamente');
    } catch (error) {
      return errorResponse('Error al eliminar imagen', 500);
    }
  }

  // ========== LINKS ==========

  async addLink(request: Request, projectId: number): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const data = await request.json() as LinkInput;
      const errors = validateLinkInput(data);
      if (errors.length > 0) {
        return errorResponse(errors[0].message);
      }

      const linkId = await this.service.addLink(projectId, {
        linkType: data.link_type,
        label: data.label,
        url: data.url,
        sortOrder: data.sort_order,
      });
      return successResponse({ id: linkId }, 'Enlace agregado exitosamente', 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al agregar enlace';
      return errorResponse(message, 500);
    }
  }

  async deleteLink(request: Request, linkId: number): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const deleted = await this.service.deleteLink(linkId);
      if (!deleted) {
        return errorResponse('Enlace no encontrado', 404);
      }
      return successResponse({ deleted: true }, 'Enlace eliminado exitosamente');
    } catch (error) {
      return errorResponse('Error al eliminar enlace', 500);
    }
  }

  // ========== TECHNOLOGIES ==========

  async addTechnology(request: Request, projectId: number): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const data = await request.json() as { technology_id?: number };
      if (!data.technology_id) {
        return errorResponse('technology_id requerido');
      }

      const added = await this.service.addTechnology(projectId, data.technology_id);
      if (!added) {
        return errorResponse('La tecnología ya está asociada al proyecto');
      }
      return successResponse({ added: true }, 'Tecnología asociada exitosamente', 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al agregar tecnología';
      return errorResponse(message, 500);
    }
  }

  async removeTechnology(request: Request, projectId: number, technologyId: number): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const removed = await this.service.removeTechnology(projectId, technologyId);
      if (!removed) {
        return errorResponse('Relación no encontrada', 404);
      }
      return successResponse({ removed: true }, 'Tecnología desasociada exitosamente');
    } catch (error) {
      return errorResponse('Error al remover tecnología', 500);
    }
  }

  // ========== LIKES ==========

  async toggleLike(request: Request, projectId: number): Promise<Response> {
    try {
      const ip = getClientIP(request);
      const visitorHash = await generateHash(ip + (request.headers.get('User-Agent') || ''));
      const ipHash = await generateHash(ip);

      const result = await this.service.toggleLike(projectId, visitorHash, ipHash);
      return successResponse(result);
    } catch (error) {
      return errorResponse('Error al procesar like', 500);
    }
  }

  async getLikes(request: Request, projectId: number): Promise<Response> {
    try {
      const count = await this.service.getLikesCount(projectId);
      return successResponse({ count });
    } catch (error) {
      return errorResponse('Error al obtener likes', 500);
    }
  }

  // ========== SOFT DELETE / TRASH ==========

  async listDeleted(request: Request): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const url = new URL(request.url);
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
      const limit = Math.min(50, parseInt(url.searchParams.get('limit') || '10'));

      const result = await this.service.listDeleted({ page, limit });
      return successResponse(result);
    } catch (error) {
      return errorResponse('Error al obtener proyectos eliminados', 500);
    }
  }

  async restore(request: Request, id: number): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const restored = await this.service.restore(id);
      if (!restored) {
        return errorResponse('Proyecto no encontrado en papelera', 404);
      }
      return successResponse({ restored: true }, 'Proyecto restaurado exitosamente');
    } catch (error) {
      return errorResponse('Error al restaurar proyecto', 500);
    }
  }

  async hardDelete(request: Request, id: number): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const deleted = await this.service.hardDelete(id);
      if (!deleted) {
        return errorResponse('Proyecto no encontrado', 404);
      }
      return successResponse({ deleted: true }, 'Proyecto eliminado permanentemente');
    } catch (error) {
      return errorResponse('Error al eliminar proyecto permanentemente', 500);
    }
  }
}
