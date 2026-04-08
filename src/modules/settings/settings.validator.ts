import { validateLength, ValidationError } from '../../shared/utils/validators';

export interface SettingInput {
  key: string;
  value: string;
  value_type?: string;
  group?: string;
}

export interface BulkSettingsInput {
  settings: SettingInput[];
}

export function validateSettingKey(key: string): boolean {
  return /^[a-z][a-z0-9_]{1,98}[a-z0-9]$/.test(key);
}

export function validateSetting(data: Partial<SettingInput>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.key || !validateSettingKey(data.key)) {
    errors.push({ field: 'key', message: 'Key debe ser snake_case (3-100 chars, ej: site_title)' });
  }

  if (data.value === undefined || data.value === null) {
    errors.push({ field: 'value', message: 'Value es requerido' });
  }

  if (data.value && !validateLength(data.value, 0, 10000)) {
    errors.push({ field: 'value', message: 'Value no puede exceder 10000 caracteres' });
  }

  const validTypes = ['string', 'number', 'boolean', 'json'];
  if (data.value_type && !validTypes.includes(data.value_type)) {
    errors.push({ field: 'value_type', message: 'Tipo debe ser: string, number, boolean o json' });
  }

  // Validar que el valor coincida con el tipo
  if (data.value_type === 'number' && isNaN(Number(data.value))) {
    errors.push({ field: 'value', message: 'Value debe ser un número válido' });
  }

  if (data.value_type === 'boolean' && !['true', 'false', '0', '1'].includes(data.value?.toLowerCase?.() ?? '')) {
    errors.push({ field: 'value', message: 'Value debe ser true, false, 0 o 1' });
  }

  if (data.value_type === 'json') {
    try {
      JSON.parse(data.value || '');
    } catch {
      errors.push({ field: 'value', message: 'Value debe ser JSON válido' });
    }
  }

  return errors;
}

export function validateBulkSettings(data: Partial<BulkSettingsInput>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.settings || !Array.isArray(data.settings)) {
    errors.push({ field: 'settings', message: 'Se requiere un array de settings' });
    return errors;
  }

  if (data.settings.length === 0) {
    errors.push({ field: 'settings', message: 'El array de settings no puede estar vacío' });
    return errors;
  }

  if (data.settings.length > 50) {
    errors.push({ field: 'settings', message: 'No se pueden actualizar más de 50 settings a la vez' });
    return errors;
  }

  for (let i = 0; i < data.settings.length; i++) {
    const settingErrors = validateSetting(data.settings[i]);
    for (const err of settingErrors) {
      errors.push({ field: `settings[${i}].${err.field}`, message: err.message });
    }
  }

  return errors;
}
