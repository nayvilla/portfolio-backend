import { validateLength, ValidationError } from '../../shared/utils/validators';

export interface TrackEventInput {
  event_type: string;
  page_path?: string;
  page_title?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
}

export function validateTrackEvent(data: Partial<TrackEventInput>): ValidationError[] {
  const errors: ValidationError[] = [];

  const validEventTypes = [
    'page_view',
    'project_view',
    'project_like',
    'contact_submit',
    'resume_download',
    'social_click',
    'scroll_depth',
    'time_on_page',
    'custom',
  ];

  if (!data.event_type || !validEventTypes.includes(data.event_type)) {
    errors.push({
      field: 'event_type',
      message: `Tipo de evento debe ser: ${validEventTypes.join(', ')}`,
    });
  }

  if (data.page_path && !validateLength(data.page_path, 0, 500)) {
    errors.push({ field: 'page_path', message: 'page_path no puede exceder 500 caracteres' });
  }

  if (data.page_title && !validateLength(data.page_title, 0, 200)) {
    errors.push({ field: 'page_title', message: 'page_title no puede exceder 200 caracteres' });
  }

  if (data.referrer && !validateLength(data.referrer, 0, 500)) {
    errors.push({ field: 'referrer', message: 'referrer no puede exceder 500 caracteres' });
  }

  if (data.metadata) {
    try {
      const json = JSON.stringify(data.metadata);
      if (json.length > 5000) {
        errors.push({ field: 'metadata', message: 'metadata no puede exceder 5000 caracteres' });
      }
    } catch {
      errors.push({ field: 'metadata', message: 'metadata debe ser un objeto JSON válido' });
    }
  }

  return errors;
}

export function validateDateRange(startDate?: string, endDate?: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (startDate && !isoDateRegex.test(startDate)) {
    errors.push({ field: 'start_date', message: 'Formato de fecha inválido (usar YYYY-MM-DD)' });
  }

  if (endDate && !isoDateRegex.test(endDate)) {
    errors.push({ field: 'end_date', message: 'Formato de fecha inválido (usar YYYY-MM-DD)' });
  }

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    errors.push({ field: 'date_range', message: 'start_date no puede ser mayor que end_date' });
  }

  return errors;
}
