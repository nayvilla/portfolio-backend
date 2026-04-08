import { Env, AuthContext, JWTPayload } from '../types';
import { extractToken, verifyJWT } from '../utils/jwt';
import { codeError } from '../utils/response';
import { ErrorCodes } from '../types/errors';

// Middleware de autenticación
export async function requireAuth(
  request: Request,
  env: Env
): Promise<{ auth: AuthContext; error: Response | null }> {
  const token = extractToken(request.headers.get('Authorization') || '');

  if (!token) {
    return {
      auth: { isAuthenticated: false, user: null as unknown as JWTPayload },
      error: codeError(ErrorCodes.AUTH_TOKEN_MISSING),
    };
  }

  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) {
    return {
      auth: { isAuthenticated: false, user: null as unknown as JWTPayload },
      error: codeError(ErrorCodes.AUTH_TOKEN_INVALID),
    };
  }

  return {
    auth: { isAuthenticated: true, user: payload },
    error: null,
  };
}

// Obtener contexto de auth sin error (para rutas opcionales)
export async function getAuthContext(
  request: Request,
  env: Env
): Promise<AuthContext> {
  const token = extractToken(request.headers.get('Authorization') || '');
  
  if (!token) {
    return { isAuthenticated: false, user: null as unknown as JWTPayload };
  }

  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) {
    return { isAuthenticated: false, user: null as unknown as JWTPayload };
  }

  return { isAuthenticated: true, user: payload };
}
