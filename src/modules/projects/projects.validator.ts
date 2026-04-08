import { validateSlug, validateLength, validateUrl, ValidationError } from '../../shared/utils/validators';
import { Project } from '../../shared/types';

export interface CreateProjectInput {
  slug: string;
  title: string;
  short_description: string;
  full_description?: string;
  role?: string;
  category?: string;
  status?: string;
  cover_image_url?: string;
  demo_url?: string;
  repository_url?: string;
  is_featured?: number;
  sort_order?: number;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {}

export function validateCreateProject(data: Partial<CreateProjectInput>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.slug || !validateSlug(data.slug)) {
    errors.push({ field: 'slug', message: 'Slug inválido (3-100 chars, minúsculas, números, guiones)' });
  }

  if (!data.title || !validateLength(data.title, 3, 200)) {
    errors.push({ field: 'title', message: 'Título debe tener entre 3 y 200 caracteres' });
  }

  if (!data.short_description || !validateLength(data.short_description, 10, 500)) {
    errors.push({ field: 'short_description', message: 'Descripción breve debe tener entre 10 y 500 caracteres' });
  }

  if (data.full_description && !validateLength(data.full_description, 0, 10000)) {
    errors.push({ field: 'full_description', message: 'Descripción completa no puede exceder 10000 caracteres' });
  }

  if (data.cover_image_url && !validateUrl(data.cover_image_url)) {
    errors.push({ field: 'cover_image_url', message: 'URL de imagen inválida' });
  }

  if (data.demo_url && !validateUrl(data.demo_url)) {
    errors.push({ field: 'demo_url', message: 'URL de demo inválida' });
  }

  if (data.repository_url && !validateUrl(data.repository_url)) {
    errors.push({ field: 'repository_url', message: 'URL de repositorio inválida' });
  }

  const validStatuses = ['draft', 'published', 'archived'];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push({ field: 'status', message: 'Estado debe ser: draft, published o archived' });
  }

  return errors;
}

export function validateUpdateProject(data: Partial<UpdateProjectInput>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.title !== undefined && !validateLength(data.title, 3, 200)) {
    errors.push({ field: 'title', message: 'Título debe tener entre 3 y 200 caracteres' });
  }

  if (data.short_description !== undefined && !validateLength(data.short_description, 10, 500)) {
    errors.push({ field: 'short_description', message: 'Descripción breve debe tener entre 10 y 500 caracteres' });
  }

  if (data.cover_image_url && !validateUrl(data.cover_image_url)) {
    errors.push({ field: 'cover_image_url', message: 'URL de imagen inválida' });
  }

  const validStatuses = ['draft', 'published', 'archived'];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push({ field: 'status', message: 'Estado debe ser: draft, published o archived' });
  }

  return errors;
}

export function validateImageInput(data: { image_url?: string; alt_text?: string }): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.image_url || !validateUrl(data.image_url)) {
    errors.push({ field: 'image_url', message: 'URL de imagen inválida' });
  }

  if (data.alt_text && !validateLength(data.alt_text, 0, 200)) {
    errors.push({ field: 'alt_text', message: 'Texto alternativo no puede exceder 200 caracteres' });
  }

  return errors;
}

export function validateLinkInput(data: { link_type?: string; label?: string; url?: string }): ValidationError[] {
  const errors: ValidationError[] = [];

  const validTypes = ['demo', 'github', 'figma', 'docs', 'video', 'other'];
  if (!data.link_type || !validTypes.includes(data.link_type)) {
    errors.push({ field: 'link_type', message: 'Tipo de enlace debe ser: demo, github, figma, docs, video u other' });
  }

  if (!data.label || !validateLength(data.label, 1, 100)) {
    errors.push({ field: 'label', message: 'Etiqueta debe tener entre 1 y 100 caracteres' });
  }

  if (!data.url || !validateUrl(data.url)) {
    errors.push({ field: 'url', message: 'URL inválida' });
  }

  return errors;
}
