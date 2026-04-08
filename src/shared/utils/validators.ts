export interface ValidationError {
  field: string;
  message: string;
}

// Email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
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
