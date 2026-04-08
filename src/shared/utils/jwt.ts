import { JWTPayload } from '../types';

const ALGORITHM = 'HS256';

// Codificar a base64url
function base64url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Firmar con HMAC-SHA256
async function sign(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return base64url(btoa(String.fromCharCode(...new Uint8Array(signature))));
}

// Crear JWT
export async function createJWT(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  secret: string,
  expiresIn: number = 86400
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const token = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
  };

  const header = { alg: ALGORITHM, typ: 'JWT' };
  const message = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(token))}`;
  const signature = await sign(message, secret);

  return `${message}.${signature}`;
}

// Verificar JWT
export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const message = `${headerB64}.${payloadB64}`;

    const expectedSignature = await sign(message, secret);
    if (signatureB64 !== expectedSignature) return null;

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));

    if (payload.exp * 1000 < Date.now()) return null;

    return payload as JWTPayload;
  } catch {
    return null;
  }
}

// Extraer token del header Authorization
export function extractToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}
