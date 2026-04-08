// Tipos para respuestas de la API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface JWTPayload {
  id: number;
  username: string;
  email: string;
  iat: number;
  exp: number;
}

export interface AuthContext {
  user: JWTPayload;
  isAuthenticated: boolean;
}
