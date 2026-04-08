import { ApiResponse } from '../types';
import { ErrorCode, ErrorCodes, ErrorCodeToStatus, ErrorMessages } from '../types/errors';

// Headers CORS
export function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// Respuesta JSON genérica
export function jsonResponse<T>(data: ApiResponse<T>, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(),
    },
  });
}

// Respuesta de éxito
export function successResponse<T>(data: T, message?: string, status: number = 200): Response {
  return jsonResponse({ success: true, data, message }, status);
}

// Respuesta de error con código
export function errorResponse(
  messageOrCode: string | ErrorCode,
  statusOrCustomMessage?: number | string,
  customStatus?: number
): Response {
  // Si es un ErrorCode conocido
  if (messageOrCode in ErrorCodeToStatus) {
    const code = messageOrCode as ErrorCode;
    const message = typeof statusOrCustomMessage === 'string' 
      ? statusOrCustomMessage 
      : ErrorMessages[code];
    const status = customStatus || (typeof statusOrCustomMessage === 'number' 
      ? statusOrCustomMessage 
      : ErrorCodeToStatus[code]);
    
    return jsonResponse({ success: false, error: message, code }, status);
  }

  // Mensaje personalizado (backward compatible)
  const message = messageOrCode;
  const status = typeof statusOrCustomMessage === 'number' ? statusOrCustomMessage : 400;
  return jsonResponse({ success: false, error: message, code: ErrorCodes.BAD_REQUEST }, status);
}

// Error con código específico
export function codeError(code: ErrorCode, customMessage?: string): Response {
  const message = customMessage || ErrorMessages[code];
  const status = ErrorCodeToStatus[code];
  return jsonResponse({ success: false, error: message, code }, status);
}

// CORS preflight
export function handleCorsPreFlight(): Response {
  return new Response(null, { headers: corsHeaders() });
}

// Alias for router compatibility
export const corsResponse = handleCorsPreFlight;

// Re-export error codes for convenience
export { ErrorCodes } from '../types/errors';
