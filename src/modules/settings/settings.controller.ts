import { Env } from '../../shared/types';
import { successResponse, errorResponse } from '../../shared/utils/response';
import { requireAuth } from '../../shared/middlewares/auth.middleware';
import { SettingsService } from './settings.service';
import { SettingInput, BulkSettingsInput, validateSetting, validateBulkSettings } from './settings.validator';

export class SettingsController {
  private service: SettingsService;

  constructor(private env: Env) {
    this.service = new SettingsService(env);
  }

  // ========== PUBLIC ==========

  async getPublic(request: Request): Promise<Response> {
    try {
      const settings = await this.service.getPublicSettings();
      return successResponse(settings);
    } catch (error) {
      return errorResponse('Error al obtener configuración', 500);
    }
  }

  // ========== ADMIN ==========

  async getAll(request: Request): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const settings = await this.service.getAll();
      return successResponse(settings);
    } catch (error) {
      return errorResponse('Error al obtener configuración', 500);
    }
  }

  async getByGroup(request: Request, group: string): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const settings = await this.service.getByGroup(group);
      return successResponse(settings);
    } catch (error) {
      return errorResponse('Error al obtener configuración', 500);
    }
  }

  async getByKey(request: Request, key: string): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const setting = await this.service.getByKey(key);
      if (!setting) {
        return errorResponse('Setting no encontrado', 404);
      }
      return successResponse(setting);
    } catch (error) {
      return errorResponse('Error al obtener setting', 500);
    }
  }

  async set(request: Request): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const data = await request.json() as SettingInput;
      const errors = validateSetting(data);
      if (errors.length > 0) {
        return errorResponse(errors[0].message);
      }

      const success = await this.service.set(data);
      if (!success) {
        return errorResponse('No se pudo guardar el setting');
      }

      return successResponse({ saved: true }, 'Setting guardado exitosamente');
    } catch (error) {
      return errorResponse('Error al guardar setting', 500);
    }
  }

  async bulkSet(request: Request): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const data = await request.json() as BulkSettingsInput;
      const errors = validateBulkSettings(data);
      if (errors.length > 0) {
        return errorResponse(errors[0].message);
      }

      const updated = await this.service.bulkSet(data.settings);
      return successResponse({ updated }, `${updated} settings actualizados exitosamente`);
    } catch (error) {
      return errorResponse('Error al guardar settings', 500);
    }
  }

  async delete(request: Request, key: string): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const deleted = await this.service.delete(key);
      if (!deleted) {
        return errorResponse('Setting no encontrado', 404);
      }
      return successResponse({ deleted: true }, 'Setting eliminado exitosamente');
    } catch (error) {
      return errorResponse('Error al eliminar setting', 500);
    }
  }

  async getGroups(request: Request): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    try {
      const groups = await this.service.getGroups();
      return successResponse(groups);
    } catch (error) {
      return errorResponse('Error al obtener grupos', 500);
    }
  }
}
