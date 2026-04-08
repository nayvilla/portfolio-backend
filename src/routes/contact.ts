import { Env, ContactMessage } from '../types';
import { errorResponse, successResponse, getClientIP, checkRateLimit } from '../middleware';
import { validateContactMessage, sanitizeInput } from '../validators';

export async function submitContactMessage(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  // Rate limiting: máx 5 mensajes por IP en 1 hora
  const clientIP = getClientIP(request);
  if (!checkRateLimit(`contact:${clientIP}`, 5, 3600)) {
    return errorResponse('Demasiadas solicitudes. Intenta más tarde.', 429);
  }

  try {
    const data = await request.json() as {
      name?: string;
      email?: string;
      phone?: string;
      subject?: string;
      message?: string;
    };

    // Validar
    const errors = validateContactMessage({
      name: data.name,
      email: data.email,
      message: data.message,
    });

    if (errors.length > 0) {
      return errorResponse(`Validación fallida: ${errors[0].message}`);
    }

    // Sanitizar
    const sanitized = {
      name: sanitizeInput(data.name || ''),
      email: data.email?.toLowerCase() || '',
      phone: data.phone ? sanitizeInput(data.phone) : null,
      subject: data.subject ? sanitizeInput(data.subject) : null,
      message: sanitizeInput(data.message || ''),
      source: 'website',
    };

    // Insertar mensaje
    const result = await env.portfolio_database
      .prepare(
        `INSERT INTO contact_messages (
          name, email, phone, subject, message, source
        ) VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        sanitized.name,
        sanitized.email,
        sanitized.phone,
        sanitized.subject,
        sanitized.message,
        sanitized.source
      )
      .run();

    // Aquí se podría enviar notificación a email/telegram/discord
    // Por ahora solo guardamos en la BD
    // await sendNotification(env, result.meta.last_row_id);

    return successResponse(
      { id: result.meta.last_row_id, ...sanitized },
      'Mensaje enviado exitosamente. Te contactaremos pronto.',
      201
    );
  } catch (error) {
    console.error('Contact message error:', error);
    return errorResponse('Error al procesar tu mensaje', 500);
  }
}

export async function getContactMessages(
  request: Request,
  env: Env,
  isAdmin: boolean
): Promise<Response> {
  if (!isAdmin) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(50, parseInt(url.searchParams.get('limit') || '20'));
    const offset = (page - 1) * limit;
    const unreadOnly = url.searchParams.get('unread') === 'true';

    let query =
      'SELECT id, name, email, phone, subject, message, is_read, created_at FROM contact_messages';
    const binds: any[] = [];

    if (unreadOnly) {
      query += ' WHERE is_read = 0';
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    binds.push(limit, offset);

    const messages = await env.portfolio_database
      .prepare(query)
      .bind(...binds)
      .all<ContactMessage>();

    // Contar total
    let countQuery = 'SELECT COUNT(*) as total FROM contact_messages';
    if (unreadOnly) {
      countQuery += ' WHERE is_read = 0';
    }

    const countResult = await env.portfolio_database
      .prepare(countQuery)
      .first<{ total: number }>();

    return successResponse({
      data: messages.results || [],
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return errorResponse('Error al obtener mensajes', 500);
  }
}

export async function markMessageAsRead(
  request: Request,
  env: Env,
  isAdmin: boolean,
  messageId: number
): Promise<Response> {
  if (!isAdmin) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const result = await env.portfolio_database
      .prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?')
      .bind(messageId)
      .run();

    if (result.meta.changes === 0) {
      return errorResponse('Mensaje no encontrado', 404);
    }

    return successResponse({ updated: true }, 'Mensaje marcado como leído');
  } catch (error) {
    console.error('Mark as read error:', error);
    return errorResponse('Error al actualizar mensaje', 500);
  }
}
