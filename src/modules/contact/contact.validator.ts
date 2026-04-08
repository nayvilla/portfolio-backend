import { validateEmail, validateEmailAsync, validateLength, ValidationError } from '../../shared/utils/validators';

// Propósitos válidos para el mensaje de contacto
export const VALID_PURPOSES = ['freelance', 'job_offer', 'question', 'collaboration', 'other'] as const;
export type ContactPurpose = typeof VALID_PURPOSES[number];

export const PURPOSE_LABELS: Record<ContactPurpose, string> = {
  freelance: 'Proyecto freelance / Contratación',
  job_offer: 'Oferta de trabajo / Vacante',
  question: 'Pregunta sobre un proyecto',
  collaboration: 'Colaboración',
  other: 'Otro',
};

export interface CreateContactInput {
  name: string;
  email: string;
  subject?: string;
  message: string;
  purpose?: ContactPurpose;
}

export function validateContactMessage(data: Partial<CreateContactInput>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.name || !validateLength(data.name, 2, 100)) {
    errors.push({ field: 'name', message: 'Nombre debe tener entre 2 y 100 caracteres' });
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push({ field: 'email', message: 'Email inválido' });
  }

  if (data.subject && !validateLength(data.subject, 0, 200)) {
    errors.push({ field: 'subject', message: 'Asunto no puede exceder 200 caracteres' });
  }

  if (!data.message || !validateLength(data.message, 10, 5000)) {
    errors.push({ field: 'message', message: 'Mensaje debe tener entre 10 y 5000 caracteres' });
  }

  // Purpose es opcional, pero si se envía debe ser válido
  if (data.purpose && !VALID_PURPOSES.includes(data.purpose as ContactPurpose)) {
    errors.push({ 
      field: 'purpose', 
      message: `Propósito debe ser uno de: ${VALID_PURPOSES.join(', ')}` 
    });
  }

  return errors;
}

// Validación asincrónica con DNS lookup (para contact submission)
export async function validateContactMessageAsync(data: Partial<CreateContactInput>): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  if (!data.name || !validateLength(data.name, 2, 100)) {
    errors.push({ field: 'name', message: 'Nombre debe tener entre 2 y 100 caracteres' });
  }

  if (!data.email) {
    errors.push({ field: 'email', message: 'Email es requerido' });
  } else {
    // Validar email con sintaxis + desechables + MX records
    const emailValidation = await validateEmailAsync(data.email);
    if (!emailValidation.valid) {
      errors.push({ field: 'email', message: emailValidation.reason || 'Email inválido' });
    }
  }

  if (data.subject && !validateLength(data.subject, 0, 200)) {
    errors.push({ field: 'subject', message: 'Asunto no puede exceder 200 caracteres' });
  }

  if (!data.message || !validateLength(data.message, 10, 5000)) {
    errors.push({ field: 'message', message: 'Mensaje debe tener entre 10 y 5000 caracteres' });
  }

  // Purpose es opcional, pero si se envía debe ser válido
  if (data.purpose && !VALID_PURPOSES.includes(data.purpose as ContactPurpose)) {
    errors.push({ 
      field: 'purpose', 
      message: `Propósito debe ser uno de: ${VALID_PURPOSES.join(', ')}` 
    });
  }

  return errors;
}

export function validateStatusUpdate(status: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const validStatuses = ['unread', 'read', 'replied', 'archived', 'spam'];

  if (!validStatuses.includes(status)) {
    errors.push({ field: 'status', message: 'Estado debe ser: unread, read, replied, archived o spam' });
  }

  return errors;
}
