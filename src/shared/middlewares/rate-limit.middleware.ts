// Rate limiting en memoria (para Workers sin KV)
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

// Obtener IP del cliente
export function getClientIP(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0] ||
    'unknown'
  );
}

// Middleware de rate limiting
export function rateLimitMiddleware(
  request: Request,
  identifier: string,
  limit: number = 5,
  windowSeconds: number = 60
): boolean {
  const ip = getClientIP(request);
  return checkRateLimit(`${identifier}:${ip}`, limit, windowSeconds);
}
