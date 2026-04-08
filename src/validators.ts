// Validadores de input
export interface ValidationError {
  field: string;
  message: string;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

export function validatePassword(password: string): boolean {
  // Mínimo 8 caracteres, al menos una mayúscula, un número y un símbolo
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*]/.test(password)
  );
}

export function validateUsername(username: string): boolean {
  // Solo letras, números, guiones y guiones bajos, 3-20 caracteres
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
}

export function validateSlug(slug: string): boolean {
  // Solo letras minúsculas, números y guiones
  const slugRegex = /^[a-z0-9-]{3,50}$/;
  return slugRegex.test(slug);
}

export function validateContactMessage(data: {
  name?: string;
  email?: string;
  message?: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.name || data.name.trim().length < 2 || data.name.length > 100) {
    errors.push({ field: 'name', message: 'Nombre debe tener entre 2 y 100 caracteres' });
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push({ field: 'email', message: 'Email inválido' });
  }

  if (!data.message || data.message.trim().length < 10 || data.message.length > 5000) {
    errors.push({ field: 'message', message: 'Mensaje debe tener entre 10 y 5000 caracteres' });
  }

  return errors;
}

export function validateProjectData(data: {
  slug?: string;
  title?: string;
  short_description?: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.slug || !validateSlug(data.slug)) {
    errors.push({ field: 'slug', message: 'Slug inválido' });
  }

  if (!data.title || data.title.length < 3 || data.title.length > 200) {
    errors.push({ field: 'title', message: 'Título debe tener entre 3 y 200 caracteres' });
  }

  if (!data.short_description || data.short_description.length < 10 || data.short_description.length > 500) {
    errors.push({ field: 'short_description', message: 'Descripción breve debe tener entre 10 y 500 caracteres' });
  }

  return errors;
}

// Sanitizar strings para evitar inyecciones
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Eliminar < y >
    .substring(0, 5000); // Limitar longitud
}
