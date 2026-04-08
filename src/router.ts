import { Env } from './shared/types';
import { corsResponse, codeError, ErrorCodes } from './shared/utils/response';
import { AuthController } from './modules/auth';
import { ProjectsController } from './modules/projects';
import { ContactController } from './modules/contact';
import { TechnologiesController } from './modules/technologies';
import { SettingsController } from './modules/settings';
import { AnalyticsController } from './modules/analytics';
import { AuditController } from './modules/audit';
import { createNotificationService } from './shared/utils/notifications';
import { generateHash } from './shared/utils/hash';

type RouteHandler = (request: Request, params: Record<string, string>) => Promise<Response>;

interface Route {
  method: string;
  pattern: RegExp;
  handler: RouteHandler;
  paramNames: string[];
}

export class Router {
  private routes: Route[] = [];
  private authController: AuthController;
  private projectsController: ProjectsController;
  private contactController: ContactController;
  private technologiesController: TechnologiesController;
  private settingsController: SettingsController;
  private analyticsController: AnalyticsController;
  private auditController: AuditController;

  constructor(private env: Env) {
    this.authController = new AuthController(env);
    this.projectsController = new ProjectsController(env);
    this.contactController = new ContactController(env);
    this.technologiesController = new TechnologiesController(env);
    this.settingsController = new SettingsController(env);
    this.analyticsController = new AnalyticsController(env);
    this.auditController = new AuditController(env);

    this.registerRoutes();
  }

  private registerRoutes(): void {
    // ========== AUTH ==========
    this.post('/api/auth/login', (req) => this.authController.login(req));
    this.post('/api/auth/register', (req) => this.authController.register(req));
    this.post('/api/auth/logout', (req) => this.authController.logout(req));
    this.get('/api/auth/profile', (req) => this.authController.getProfile(req));

    // ========== PROJECTS ==========
    this.get('/api/projects', (req) => this.projectsController.list(req));
    this.get('/api/projects/:slug', (req, p) => this.projectsController.getBySlug(req, p.slug));
    this.post('/api/projects', (req) => this.projectsController.create(req));
    this.put('/api/projects/:id', (req, p) => this.projectsController.update(req, parseInt(p.id)));
    this.delete('/api/projects/:id', (req, p) => this.projectsController.delete(req, parseInt(p.id)));
    this.post('/api/projects/:id/publish', (req, p) => this.projectsController.publish(req, parseInt(p.id)));

    // Project Images
    this.post('/api/projects/:id/images', (req, p) => this.projectsController.addImage(req, parseInt(p.id)));
    this.delete('/api/projects/images/:id', (req, p) => this.projectsController.deleteImage(req, parseInt(p.id)));

    // Project Links
    this.post('/api/projects/:id/links', (req, p) => this.projectsController.addLink(req, parseInt(p.id)));
    this.delete('/api/projects/links/:id', (req, p) => this.projectsController.deleteLink(req, parseInt(p.id)));

    // Project Technologies
    this.post('/api/projects/:id/technologies', (req, p) => this.projectsController.addTechnology(req, parseInt(p.id)));
    this.delete('/api/projects/:projectId/technologies/:techId', (req, p) =>
      this.projectsController.removeTechnology(req, parseInt(p.projectId), parseInt(p.techId))
    );

    // Project Likes
    this.post('/api/projects/:id/like', (req, p) => this.projectsController.toggleLike(req, parseInt(p.id)));
    this.get('/api/projects/:id/likes', (req, p) => this.projectsController.getLikes(req, parseInt(p.id)));

    // Project Trash (Soft Delete)
    this.get('/api/admin/projects/trash', (req) => this.projectsController.listDeleted(req));
    this.post('/api/admin/projects/:id/restore', (req, p) => this.projectsController.restore(req, parseInt(p.id)));
    this.delete('/api/admin/projects/:id/permanent', (req, p) => this.projectsController.hardDelete(req, parseInt(p.id)));

    // ========== CONTACT ==========
    this.post('/api/contact', (req) => this.contactController.submit(req));
    this.get('/api/admin/contact', (req) => this.contactController.list(req));
    this.get('/api/admin/contact/unread', (req) => this.contactController.getUnreadCount(req));
    this.get('/api/admin/contact/:id', (req, p) => this.contactController.getById(req, parseInt(p.id)));
    this.put('/api/admin/contact/:id', (req, p) => this.contactController.updateStatus(req, parseInt(p.id)));
    this.delete('/api/admin/contact/:id', (req, p) => this.contactController.delete(req, parseInt(p.id)));

    // ========== TECHNOLOGIES ==========
    this.get('/api/technologies', (req) => this.technologiesController.list(req));
    this.get('/api/technologies/categories', (req) => this.technologiesController.getCategories(req));
    this.get('/api/technologies/:slug', (req, p) => this.technologiesController.getBySlug(req, p.slug));
    this.post('/api/technologies', (req) => this.technologiesController.create(req));
    this.put('/api/technologies/:id', (req, p) => this.technologiesController.update(req, parseInt(p.id)));
    this.delete('/api/technologies/:id', (req, p) => this.technologiesController.delete(req, parseInt(p.id)));

    // ========== SETTINGS ==========
    this.get('/api/settings', (req) => this.settingsController.getPublic(req));
    this.get('/api/admin/settings', (req) => this.settingsController.getAll(req));
    this.get('/api/admin/settings/groups', (req) => this.settingsController.getGroups(req));
    this.get('/api/admin/settings/group/:group', (req, p) => this.settingsController.getByGroup(req, p.group));
    this.get('/api/admin/settings/:key', (req, p) => this.settingsController.getByKey(req, p.key));
    this.post('/api/admin/settings', (req) => this.settingsController.set(req));
    this.post('/api/admin/settings/bulk', (req) => this.settingsController.bulkSet(req));
    this.delete('/api/admin/settings/:key', (req, p) => this.settingsController.delete(req, p.key));

    // ========== ANALYTICS ==========
    this.post('/api/analytics/track', (req) => this.analyticsController.track(req));
    this.get('/api/admin/analytics', (req) => this.analyticsController.list(req));
    this.get('/api/admin/analytics/summary', (req) => this.analyticsController.getSummary(req));
    this.get('/api/admin/analytics/types', (req) => this.analyticsController.getEventTypes(req));
    this.post('/api/admin/analytics/cleanup', (req) => this.analyticsController.cleanup(req));
    this.delete('/api/admin/analytics/:id', (req, p) => this.analyticsController.delete(req, parseInt(p.id)));

    // ========== AUDIT ==========
    this.get('/api/admin/audit', (req) => this.auditController.list(req));
    this.get('/api/admin/audit/stats', (req) => this.auditController.getStats(req));
    this.get('/api/admin/audit/failed-logins', (req) => this.auditController.listFailedLogins(req));
    this.get('/api/admin/audit/entity/:type/:id', (req, p) => this.auditController.getEntityHistory(req, p.type, parseInt(p.id)));
    this.get('/api/admin/audit/:id', (req, p) => this.auditController.getById(req, parseInt(p.id)));
    this.delete('/api/admin/audit/cleanup', (req) => this.auditController.cleanup(req));

    // ========== HEALTH ==========
    this.get('/api/health', async () => {
      return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json' },
      });
    });
  }

  private addRoute(method: string, path: string, handler: RouteHandler): void {
    const paramNames: string[] = [];
    const patternString = path.replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    const pattern = new RegExp(`^${patternString}$`);
    this.routes.push({ method, pattern, handler, paramNames });
  }

  private get(path: string, handler: RouteHandler): void {
    this.addRoute('GET', path, handler);
  }

  private post(path: string, handler: RouteHandler): void {
    this.addRoute('POST', path, handler);
  }

  private put(path: string, handler: RouteHandler): void {
    this.addRoute('PUT', path, handler);
  }

  private delete(path: string, handler: RouteHandler): void {
    this.addRoute('DELETE', path, handler);
  }

  async handle(request: Request): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return corsResponse();
    }

    const url = new URL(request.url);
    const path = url.pathname;

    for (const route of this.routes) {
      if (route.method !== request.method) continue;

      const match = path.match(route.pattern);
      if (match) {
        const params: Record<string, string> = {};
        route.paramNames.forEach((name, i) => {
          params[name] = match[i + 1];
        });

        try {
          return await route.handler(request, params);
        } catch (error) {
          console.error('Route error:', error);
          
          // Enviar notificación de error crítico (no bloquear la respuesta)
          this.sendCriticalErrorNotification(request, error).catch(console.error);
          
          return codeError(ErrorCodes.INTERNAL_ERROR);
        }
      }
    }

    return codeError(ErrorCodes.NOT_FOUND, 'Ruta no encontrada');
  }

  // Notificación de errores críticos
  private async sendCriticalErrorNotification(request: Request, error: unknown): Promise<void> {
    try {
      const notificationService = createNotificationService(this.env as unknown as Record<string, string>);
      
      const url = new URL(request.url);
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const ipHash = await generateHash(ip);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      await notificationService.sendAll({
        type: 'error_alert',
        title: '🚨 Error Crítico en Portfolio Backend',
        message: `Se ha producido un error en el servidor.\n\nError: ${errorMessage}`,
        metadata: {
          'Endpoint': `${request.method} ${url.pathname}`,
          'Timestamp': new Date().toISOString(),
          'IP Hash': ipHash.substring(0, 12) + '...',
          'User Agent': request.headers.get('User-Agent')?.substring(0, 50) || 'N/A',
          'Stack': errorStack?.substring(0, 200) || 'N/A',
        },
      });
    } catch (notifError) {
      // No fallar si la notificación falla
      console.error('Error sending critical error notification:', notifError);
    }
  }
}
