import { validateSlug, validateLength, validateUrl, ValidationError } from '../../shared/utils/validators';

export interface CreateTechnologyInput {
  slug: string;
  name: string;
  icon_url?: string;
  category?: string;
  proficiency_level?: number;
  sort_order?: number;
}

export interface UpdateTechnologyInput extends Partial<Omit<CreateTechnologyInput, 'slug'>> {}

export function validateCreateTechnology(data: Partial<CreateTechnologyInput>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.slug || !validateSlug(data.slug)) {
    errors.push({ field: 'slug', message: 'Slug inválido (3-100 chars, minúsculas, números, guiones)' });
  }

  if (!data.name || !validateLength(data.name, 1, 100)) {
    errors.push({ field: 'name', message: 'Nombre debe tener entre 1 y 100 caracteres' });
  }

  if (data.icon_url && !validateUrl(data.icon_url)) {
    errors.push({ field: 'icon_url', message: 'URL de ícono inválida' });
  }

  const validCategories = ['frontend', 'backend', 'database', 'devops', 'mobile', 'tools', 'other'];
  if (data.category && !validCategories.includes(data.category)) {
    errors.push({ field: 'category', message: 'Categoría debe ser: frontend, backend, database, devops, mobile, tools u other' });
  }

  if (data.proficiency_level !== undefined) {
    if (data.proficiency_level < 0 || data.proficiency_level > 100) {
      errors.push({ field: 'proficiency_level', message: 'Nivel de proficiencia debe ser entre 0 y 100' });
    }
  }

  return errors;
}

export function validateUpdateTechnology(data: UpdateTechnologyInput): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.name !== undefined && !validateLength(data.name, 1, 100)) {
    errors.push({ field: 'name', message: 'Nombre debe tener entre 1 y 100 caracteres' });
  }

  if (data.icon_url && !validateUrl(data.icon_url)) {
    errors.push({ field: 'icon_url', message: 'URL de ícono inválida' });
  }

  const validCategories = ['frontend', 'backend', 'database', 'devops', 'mobile', 'tools', 'other'];
  if (data.category && !validCategories.includes(data.category)) {
    errors.push({ field: 'category', message: 'Categoría inválida' });
  }

  if (data.proficiency_level !== undefined) {
    if (data.proficiency_level < 0 || data.proficiency_level > 100) {
      errors.push({ field: 'proficiency_level', message: 'Nivel de proficiencia debe ser entre 0 y 100' });
    }
  }

  return errors;
}
