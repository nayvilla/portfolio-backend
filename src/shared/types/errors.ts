// Códigos de error estandarizados para la API

export const ErrorCodes = {
  // Autenticación (AUTH_*)
  AUTH_TOKEN_MISSING: 'AUTH_TOKEN_MISSING',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_USER_INACTIVE: 'AUTH_USER_INACTIVE',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',

  // Validación (VALIDATION_*)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  VALIDATION_INVALID_LENGTH: 'VALIDATION_INVALID_LENGTH',
  VALIDATION_INVALID_EMAIL: 'VALIDATION_INVALID_EMAIL',
  VALIDATION_INVALID_URL: 'VALIDATION_INVALID_URL',
  VALIDATION_INVALID_SLUG: 'VALIDATION_INVALID_SLUG',
  VALIDATION_WEAK_PASSWORD: 'VALIDATION_WEAK_PASSWORD',

  // Proyectos (PROJECT_*)
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  PROJECT_SLUG_EXISTS: 'PROJECT_SLUG_EXISTS',
  PROJECT_ALREADY_PUBLISHED: 'PROJECT_ALREADY_PUBLISHED',
  PROJECT_CANNOT_DELETE: 'PROJECT_CANNOT_DELETE',
  PROJECT_IMAGE_NOT_FOUND: 'PROJECT_IMAGE_NOT_FOUND',
  PROJECT_LINK_NOT_FOUND: 'PROJECT_LINK_NOT_FOUND',

  // Tecnologías (TECHNOLOGY_*)
  TECHNOLOGY_NOT_FOUND: 'TECHNOLOGY_NOT_FOUND',
  TECHNOLOGY_SLUG_EXISTS: 'TECHNOLOGY_SLUG_EXISTS',
  TECHNOLOGY_IN_USE: 'TECHNOLOGY_IN_USE',

  // Contacto (CONTACT_*)
  CONTACT_NOT_FOUND: 'CONTACT_NOT_FOUND',
  CONTACT_ALREADY_READ: 'CONTACT_ALREADY_READ',
  CONTACT_INVALID_STATUS: 'CONTACT_INVALID_STATUS',

  // Likes (LIKE_*)
  LIKE_ALREADY_EXISTS: 'LIKE_ALREADY_EXISTS',
  LIKE_NOT_FOUND: 'LIKE_NOT_FOUND',

  // Settings (SETTING_*)
  SETTING_NOT_FOUND: 'SETTING_NOT_FOUND',
  SETTING_KEY_EXISTS: 'SETTING_KEY_EXISTS',

  // Rate Limiting (RATE_*)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Usuario (USER_*)
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  USER_EMAIL_EXISTS: 'USER_EMAIL_EXISTS',

  // Notificaciones (NOTIFICATION_*)
  NOTIFICATION_FAILED: 'NOTIFICATION_FAILED',
  NOTIFICATION_CHANNEL_INVALID: 'NOTIFICATION_CHANNEL_INVALID',

  // General (GENERAL_*)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  CONFLICT: 'CONFLICT',
  FORBIDDEN: 'FORBIDDEN',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// Mapeo de códigos a HTTP status
export const ErrorCodeToStatus: Record<ErrorCode, number> = {
  // 400 Bad Request
  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.VALIDATION_REQUIRED_FIELD]: 400,
  [ErrorCodes.VALIDATION_INVALID_FORMAT]: 400,
  [ErrorCodes.VALIDATION_INVALID_LENGTH]: 400,
  [ErrorCodes.VALIDATION_INVALID_EMAIL]: 400,
  [ErrorCodes.VALIDATION_INVALID_URL]: 400,
  [ErrorCodes.VALIDATION_INVALID_SLUG]: 400,
  [ErrorCodes.VALIDATION_WEAK_PASSWORD]: 400,
  [ErrorCodes.BAD_REQUEST]: 400,
  [ErrorCodes.CONTACT_INVALID_STATUS]: 400,
  [ErrorCodes.NOTIFICATION_CHANNEL_INVALID]: 400,

  // 401 Unauthorized
  [ErrorCodes.AUTH_TOKEN_MISSING]: 401,
  [ErrorCodes.AUTH_TOKEN_INVALID]: 401,
  [ErrorCodes.AUTH_TOKEN_EXPIRED]: 401,
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: 401,
  [ErrorCodes.AUTH_UNAUTHORIZED]: 401,

  // 403 Forbidden
  [ErrorCodes.AUTH_USER_INACTIVE]: 403,
  [ErrorCodes.FORBIDDEN]: 403,

  // 404 Not Found
  [ErrorCodes.PROJECT_NOT_FOUND]: 404,
  [ErrorCodes.TECHNOLOGY_NOT_FOUND]: 404,
  [ErrorCodes.CONTACT_NOT_FOUND]: 404,
  [ErrorCodes.SETTING_NOT_FOUND]: 404,
  [ErrorCodes.USER_NOT_FOUND]: 404,
  [ErrorCodes.PROJECT_IMAGE_NOT_FOUND]: 404,
  [ErrorCodes.PROJECT_LINK_NOT_FOUND]: 404,
  [ErrorCodes.LIKE_NOT_FOUND]: 404,
  [ErrorCodes.NOT_FOUND]: 404,

  // 409 Conflict
  [ErrorCodes.PROJECT_SLUG_EXISTS]: 409,
  [ErrorCodes.PROJECT_ALREADY_PUBLISHED]: 409,
  [ErrorCodes.TECHNOLOGY_SLUG_EXISTS]: 409,
  [ErrorCodes.TECHNOLOGY_IN_USE]: 409,
  [ErrorCodes.SETTING_KEY_EXISTS]: 409,
  [ErrorCodes.LIKE_ALREADY_EXISTS]: 409,
  [ErrorCodes.CONTACT_ALREADY_READ]: 409,
  [ErrorCodes.USER_ALREADY_EXISTS]: 409,
  [ErrorCodes.USER_EMAIL_EXISTS]: 409,
  [ErrorCodes.PROJECT_CANNOT_DELETE]: 409,
  [ErrorCodes.CONFLICT]: 409,

  // 429 Too Many Requests
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 429,

  // 500 Internal Server Error
  [ErrorCodes.INTERNAL_ERROR]: 500,
  [ErrorCodes.NOTIFICATION_FAILED]: 500,
};

// Mensajes por defecto para cada código
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCodes.AUTH_TOKEN_MISSING]: 'Token de autenticación no proporcionado',
  [ErrorCodes.AUTH_TOKEN_INVALID]: 'Token de autenticación inválido',
  [ErrorCodes.AUTH_TOKEN_EXPIRED]: 'Token de autenticación expirado',
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: 'Credenciales inválidas',
  [ErrorCodes.AUTH_USER_INACTIVE]: 'Usuario desactivado',
  [ErrorCodes.AUTH_UNAUTHORIZED]: 'No autorizado',

  [ErrorCodes.VALIDATION_ERROR]: 'Error de validación',
  [ErrorCodes.VALIDATION_REQUIRED_FIELD]: 'Campo requerido',
  [ErrorCodes.VALIDATION_INVALID_FORMAT]: 'Formato inválido',
  [ErrorCodes.VALIDATION_INVALID_LENGTH]: 'Longitud inválida',
  [ErrorCodes.VALIDATION_INVALID_EMAIL]: 'Email inválido',
  [ErrorCodes.VALIDATION_INVALID_URL]: 'URL inválida',
  [ErrorCodes.VALIDATION_INVALID_SLUG]: 'Slug inválido',
  [ErrorCodes.VALIDATION_WEAK_PASSWORD]: 'Contraseña muy débil',

  [ErrorCodes.PROJECT_NOT_FOUND]: 'Proyecto no encontrado',
  [ErrorCodes.PROJECT_SLUG_EXISTS]: 'El slug del proyecto ya existe',
  [ErrorCodes.PROJECT_ALREADY_PUBLISHED]: 'El proyecto ya está publicado',
  [ErrorCodes.PROJECT_CANNOT_DELETE]: 'No se puede eliminar el proyecto',
  [ErrorCodes.PROJECT_IMAGE_NOT_FOUND]: 'Imagen del proyecto no encontrada',
  [ErrorCodes.PROJECT_LINK_NOT_FOUND]: 'Enlace del proyecto no encontrado',

  [ErrorCodes.TECHNOLOGY_NOT_FOUND]: 'Tecnología no encontrada',
  [ErrorCodes.TECHNOLOGY_SLUG_EXISTS]: 'El slug de la tecnología ya existe',
  [ErrorCodes.TECHNOLOGY_IN_USE]: 'La tecnología está en uso',

  [ErrorCodes.CONTACT_NOT_FOUND]: 'Mensaje de contacto no encontrado',
  [ErrorCodes.CONTACT_ALREADY_READ]: 'El mensaje ya fue marcado como leído',
  [ErrorCodes.CONTACT_INVALID_STATUS]: 'Estado de mensaje inválido',

  [ErrorCodes.LIKE_ALREADY_EXISTS]: 'Ya has dado like a este proyecto',
  [ErrorCodes.LIKE_NOT_FOUND]: 'Like no encontrado',

  [ErrorCodes.SETTING_NOT_FOUND]: 'Configuración no encontrada',
  [ErrorCodes.SETTING_KEY_EXISTS]: 'La clave de configuración ya existe',

  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Límite de peticiones excedido. Intenta más tarde',

  [ErrorCodes.USER_NOT_FOUND]: 'Usuario no encontrado',
  [ErrorCodes.USER_ALREADY_EXISTS]: 'El usuario ya existe',
  [ErrorCodes.USER_EMAIL_EXISTS]: 'El email ya está en uso',

  [ErrorCodes.NOTIFICATION_FAILED]: 'Error al enviar notificación',
  [ErrorCodes.NOTIFICATION_CHANNEL_INVALID]: 'Canal de notificación inválido',

  [ErrorCodes.INTERNAL_ERROR]: 'Error interno del servidor',
  [ErrorCodes.NOT_FOUND]: 'Recurso no encontrado',
  [ErrorCodes.BAD_REQUEST]: 'Petición inválida',
  [ErrorCodes.CONFLICT]: 'Conflicto con el estado actual',
  [ErrorCodes.FORBIDDEN]: 'Acceso prohibido',
};
