import { validateUsername, validatePassword, validateEmail, ValidationError } from '../../shared/utils/validators';

export interface LoginInput {
  username: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export function validateLogin(data: Partial<LoginInput>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.username || !validateUsername(data.username)) {
    errors.push({ field: 'username', message: 'Usuario inválido (3-20 caracteres alfanuméricos)' });
  }

  if (!data.password || data.password.length < 1) {
    errors.push({ field: 'password', message: 'Contraseña requerida' });
  }

  return errors;
}

export function validateRegister(data: Partial<RegisterInput>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.username || !validateUsername(data.username)) {
    errors.push({ field: 'username', message: 'Usuario inválido (3-20 caracteres, solo letras, números, - y _)' });
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push({ field: 'email', message: 'Email inválido' });
  }

  if (!data.password || !validatePassword(data.password)) {
    errors.push({
      field: 'password',
      message: 'Contraseña débil. Mínimo 8 caracteres, 1 mayúscula, 1 número, 1 símbolo (!@#$%^&*)',
    });
  }

  return errors;
}
