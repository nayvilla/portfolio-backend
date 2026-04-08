import { Env, APIResponse, JWTPayload } from './types';
import { extractToken, verifyJWT } from './auth';

export interface AuthContext {
  user: JWTPayload;
  isAuthenticated: boolean;
}

export interface RouteHandler {
  (request: Request, env: Env, context?: AuthContext): Promise<Response>;
}

// Middleware para autenticación
export async function requireAuth(
  request: Request,
  env: Env
): Promise<{ auth: AuthContext; error: Response | null }> {
  const token = extractToken(request.headers.get('Authorization') || '');

  if (!token) {
    return {
      auth: { isAuthenticated: false, user: null as any },
      error: jsonResponse({ success: false, error: 'Token no proporcionado' }, 401),
    };
  }

  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) {
    return {
      auth: { isAuthenticated: false, user: null as any },
      error: jsonResponse({ success: false, error: 'Token inválido o expirado' }, 401),
    };
  }

  return {
    auth: { isAuthenticated: true, user: payload },
    error: null,
  };
}

// Rate limiting simple en memoria (para desarrollo)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  limit: number = 5,
  windowSeconds: number = 60
): boolean {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;
  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowSeconds * 1000 });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count++;
  return true;
}

// Helpers para responses
export function jsonResponse<T = any>(data: APIResponse<T>, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export function errorResponse(message: string, status: number = 400): Response {
  return jsonResponse({ success: false, error: message }, status);
}

export function successResponse<T = any>(data: T, message?: string, status: number = 200): Response {
  return jsonResponse({ success: true, data, message }, status);
}

// Obtener IP del cliente
export function getClientIP(request: Request): string {
  return request.headers.get('CF-Connecting-IP') || 
         request.headers.get('X-Forwarded-For')?.split(',')[0] ||
         'unknown';
}

// CORS Headers
export function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// Manejar CORS preflight
export function handleCorsPreFlight(): Response {
  return new Response(null, {
    headers: corsHeaders(),
  });
}
