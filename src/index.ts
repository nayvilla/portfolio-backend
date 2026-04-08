import { Env } from './shared/types';
import { Router } from './router';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Verificar variables de entorno
    if (!env.JWT_SECRET) {
      console.error('JWT_SECRET no está configurado');
      return new Response(JSON.stringify({ error: 'Error de configuración del servidor' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const router = new Router(env);
    return router.handle(request);
  },
};

