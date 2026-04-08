import { Env } from '../../shared/types';
import { successResponse, codeError, ErrorCodes } from '../../shared/utils/response';
import { requireAuth } from '../../shared/middlewares/auth.middleware';
import { AuthService } from './auth.service';
import { validateLogin, validateRegister } from './auth.validator';
import { AuditService } from '../audit';

export class AuthController {
  private service: AuthService;
  private auditService: AuditService;

  constructor(private env: Env) {
    this.service = new AuthService(env);
    this.auditService = new AuditService(env);
  }

  async login(request: Request): Promise<Response> {
    try {
      const data = await request.json() as { username?: string; password?: string };

      const errors = validateLogin(data);
      if (errors.length > 0) {
        return codeError(ErrorCodes.VALIDATION_ERROR, errors[0].message);
      }

      // Check if IP is blocked due to too many failed attempts
      const isBlocked = await this.auditService.checkFailedAttempts(request);
      if (isBlocked) {
        return codeError(ErrorCodes.RATE_LIMIT_EXCEEDED, 'Demasiados intentos fallidos. Intenta más tarde.');
      }

      try {
        const result = await this.service.login(data.username!, data.password!);
        
        // Log successful login
        await this.auditService.logFromRequest(
          request,
          result.user.id,
          'login',
          'admin_user',
          result.user.id
        );

        return successResponse(result, 'Login exitoso');
      } catch (error) {
        // Log failed login attempt
        await this.auditService.logFailedLogin(
          request,
          data.username,
          undefined,
          error instanceof Error ? error.message : 'Unknown error'
        );

        const message = error instanceof Error ? error.message : 'Error en login';
        if (message.includes('Credenciales')) {
          return codeError(ErrorCodes.AUTH_INVALID_CREDENTIALS);
        }
        if (message.includes('desactivado')) {
          return codeError(ErrorCodes.AUTH_USER_INACTIVE);
        }
        return codeError(ErrorCodes.INTERNAL_ERROR);
      }
    } catch (error) {
      return codeError(ErrorCodes.BAD_REQUEST, 'Datos de entrada inválidos');
    }
  }

  async register(request: Request): Promise<Response> {
    try {
      const data = await request.json() as { username?: string; email?: string; password?: string };

      const errors = validateRegister(data);
      if (errors.length > 0) {
        return codeError(ErrorCodes.VALIDATION_ERROR, errors[0].message);
      }

      const result = await this.service.register(data.username!, data.email!, data.password!);
      
      // Log new user registration
      await this.auditService.logFromRequest(
        request,
        result.id,
        'create',
        'admin_user',
        result.id,
        undefined,
        { username: result.username, email: result.email }
      );

      return successResponse(result, 'Usuario creado exitosamente', 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al registrar';
      if (message.includes('existe')) {
        return codeError(ErrorCodes.USER_ALREADY_EXISTS);
      }
      return codeError(ErrorCodes.INTERNAL_ERROR);
    }
  }

  async getProfile(request: Request): Promise<Response> {
    try {
      const { auth, error } = await requireAuth(request, this.env);
      if (error) return error;

      const profile = await this.service.getProfile(auth.user.id);
      if (!profile) {
        return codeError(ErrorCodes.USER_NOT_FOUND);
      }

      return successResponse(profile);
    } catch (error) {
      return codeError(ErrorCodes.INTERNAL_ERROR);
    }
  }

  async logout(request: Request): Promise<Response> {
    const { auth, error } = await requireAuth(request, this.env);
    if (error) return error;

    // Log logout
    await this.auditService.logFromRequest(
      request,
      auth.user.id,
      'logout',
      'admin_user',
      auth.user.id
    );

    return successResponse({ success: true }, 'Sesión cerrada exitosamente');
  }
}
