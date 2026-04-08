import { Env, AdminUser, JWTPayload } from '../types';
import { createJWT } from '../auth';
import { validateUsername, validatePassword, validateEmail } from '../validators';
import { jsonResponse, errorResponse, successResponse } from '../middleware';

// Hash simple para demostración (en producción usa bcrypt)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computedHash = await hashPassword(password);
  return computedHash === hash;
}

export async function handleLogin(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const data = await request.json() as {
      username?: string;
      password?: string;
    };

    if (!data.username || !data.password) {
      return errorResponse('Usuario y contraseña requeridos');
    }

    if (!validateUsername(data.username)) {
      return errorResponse('Formato de usuario inválido');
    }

    // Buscar usuario en la BD
    const user = await env.portfolio_database
      .prepare('SELECT * FROM admin_users WHERE username = ? LIMIT 1')
      .bind(data.username)
      .first<AdminUser>();

    if (!user) {
      return errorResponse('Credenciales inválidas', 401);
    }

    // Verificar contraseña
    const isValid = await verifyPassword(data.password, user.password_hash);
    if (!isValid) {
      return errorResponse('Credenciales inválidas', 401);
    }

    if (!user.is_active) {
      return errorResponse('Usuario desactivado', 403);
    }

    // Crear JWT
    const token = await createJWT(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      env.JWT_SECRET,
      86400 // 24 horas
    );

    return successResponse({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Error en el servidor', 500);
  }
}

export async function handleRegister(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const data = await request.json() as {
      username?: string;
      email?: string;
      password?: string;
    };

    // Validaciones
    if (!validateUsername(data.username || '')) {
      return errorResponse('Nombre de usuario inválido (3-20 caracteres, solo letras, números, - y _)');
    }

    if (!validateEmail(data.email || '')) {
      return errorResponse('Email inválido');
    }

    if (!validatePassword(data.password || '')) {
      return errorResponse(
        'Contraseña débil. Debe tener mínimo 8 caracteres, una mayúscula, un número y un símbolo (!@#$%^&*)'
      );
    }

    // Verificar que no exista
    const exists = await env.portfolio_database
      .prepare('SELECT id FROM admin_users WHERE username = ? OR email = ? LIMIT 1')
      .bind(data.username, data.email)
      .first();

    if (exists) {
      return errorResponse('Usuario o email ya existe');
    }

    // Hash de contraseña
    const passwordHash = await hashPassword(data.password!);

    // Insertar
    const result = await env.portfolio_database
      .prepare(
        'INSERT INTO admin_users (username, email, password_hash, is_active) VALUES (?, ?, ?, 1)'
      )
      .bind(data.username, data.email, passwordHash)
      .run();

    if (!result.success) {
      return errorResponse('Error al crear usuario', 500);
    }

    return successResponse(
      { id: result.meta.last_row_id, username: data.username, email: data.email },
      'Usuario creado exitosamente',
      201
    );
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse('Error en el servidor', 500);
  }
}
