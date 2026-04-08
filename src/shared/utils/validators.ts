export interface ValidationError {
  field: string;
  message: string;
}

// Lista de dominios desechables (disposable/temporary email services)
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  // Principales servicios de email desechables
  'tempmail.com',
  '10minutemail.com',
  '10mins.com',
  'guerrillamail.com',
  'mailinator.com',
  'maildrop.cc',
  'throwaway.email',
  'trashmail.com',
  'yopmail.com',
  'fakeinbox.com',
  'spam4.me',
  'sharklasers.com',
  'dispostable.com',
  'mytrashmail.com',
  // Más servicios populares
  'guerrillamail.info',
  'pokemail.net',
  'spam-mail.com',
  'tempmail.org',
  'myspace.com', // spam
]);

// Validación de email: Sintaxis + Desechables + MX Records
export async function validateEmailAsync(email: string): Promise<{ valid: boolean; reason?: string }> {
  // 1. Validar sintaxis
  const syntaxValid = validateEmailSyntax(email);
  if (!syntaxValid) {
    return { valid: false, reason: 'Formato de email inválido' };
  }

  const domain = email.split('@')[1].toLowerCase();

  // 2. Verificar que no sea desechable
  const isDisposable = DISPOSABLE_EMAIL_DOMAINS.has(domain);
  if (isDisposable) {
    return { valid: false, reason: 'No se aceptan emails desechables/temporales' };
  }

  // 3. Validar MX records (DNS lookup)
  try {
    const hasMX = await validateMXRecords(domain);
    if (!hasMX) {
      return { valid: false, reason: 'El dominio de email no existe' };
    }
  } catch (error) {
    // Si falla el DNS lookup, permitir (es mejor ser lenient que bloquear)
    console.warn(`MX validation failed for ${domain}:`, error);
  }

  return { valid: true };
}

// Validación de sintaxis simple (para uso sincrónico si necesario)
function validateEmailSyntax(email: string): boolean {
  // RFC 5322 simplified regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

// Validar MX records usando Google's DNS API
async function validateMXRecords(domain: string): Promise<boolean> {
  try {
    // Usar Google's public DNS API (DoH - DNS over HTTPS)
    const response = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`,
      {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      }
    );

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as {
      Answer?: Array<{ type: number }>;
      Status?: number;
    };

    // Status 0 = NOERROR, Status 3 = NXDOMAIN (domain doesn't exist)
    if (data.Status === 3) {
      return false;
    }

    // Check if there are any MX records (type 15)
    const hasMX = data.Answer?.some((record) => record.type === 15) ?? false;

    // Si no hay MX records, probablemente no hay mail server
    // Pero algunos dominios pueden tener A records y aún recibir email
    // Entonces permitir si hay A records también
    if (!hasMX) {
      const hasARecord = data.Answer?.some((record) => record.type === 1) ?? false;
      return hasARecord;
    }

    return true;
  } catch (error) {
    console.error(`MX validation error for ${domain}:`, error);
    // Si hay error en la validación, ser lenient y permitir
    return true;
  }
}

// Email (versión sincrónica, solo sintaxis)
export function validateEmail(email: string): boolean {
  return validateEmailSyntax(email);
}

// Contraseña: 8+ chars, mayúscula, número, símbolo
export function validatePassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*]/.test(password)
  );
}

// Username: 3-20 chars, alfanumérico + guiones
export function validateUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
}

// Slug: minúsculas, números, guiones
export function validateSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9-]{3,100}$/;
  return slugRegex.test(slug);
}

// URL válida
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return url.length <= 500;
  } catch {
    return false;
  }
}

// Longitud de string
export function validateLength(str: string, min: number, max: number): boolean {
  return str.length >= min && str.length <= max;
}

// Sanitizar input
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, 5000);
}

// Generar slug desde título
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}
