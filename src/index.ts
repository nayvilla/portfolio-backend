export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Ruta raíz
    if (url.pathname === '/') {
      return new Response('Portfolio Backend API', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Ruta de health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 404
    return new Response('Not Found', { status: 404 });
  },
};

interface Env {}
export interface ExecutionContext {
  waitUntil(promise: Promise<void>): void;
}
