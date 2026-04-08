import { Env, Project } from '../types';
import { AuthContext, errorResponse, successResponse } from '../middleware';
import { validateProjectData, sanitizeInput } from '../validators';

export async function getPublicProjects(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(50, parseInt(url.searchParams.get('limit') || '10'));
    const offset = (page - 1) * limit;

    // Solo proyectos publicados
    const projects = await env.portfolio_database
      .prepare(
        `SELECT * FROM projects 
         WHERE status = 'published' 
         ORDER BY sort_order ASC, published_at DESC 
         LIMIT ? OFFSET ?`
      )
      .bind(limit, offset)
      .all<Project>();

    // Contar total
    const countResult = await env.portfolio_database
      .prepare("SELECT COUNT(*) as total FROM projects WHERE status = 'published'")
      .first<{ total: number}>();

    return successResponse({
      data: projects.results || [],
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Get projects error:', error);
    return errorResponse('Error al obtener proyectos', 500);
  }
}

export async function getProjectBySlug(request: Request, env: Env, slug: string): Promise<Response> {
  try {
    const project = await env.portfolio_database
      .prepare(
        `SELECT * FROM projects 
         WHERE slug = ? AND status = 'published'`
      )
      .bind(slug)
      .first<Project>();

    if (!project) {
      return errorResponse('Proyecto no encontrado', 404);
    }

    // Obtener imágenes, links y tecnologías
    const [images, links, technologies] = await Promise.all([
      env.portfolio_database
        .prepare(
          'SELECT id, image_url, alt_text, sort_order FROM project_images WHERE project_id = ? ORDER BY sort_order'
        )
        .bind(project.id)
        .all(),
      env.portfolio_database
        .prepare(
          'SELECT id, link_type, label, url FROM project_links WHERE project_id = ? ORDER BY sort_order'
        )
        .bind(project.id)
        .all(),
      env.portfolio_database
        .prepare(
          `SELECT t.id, t.name, t.slug, t.icon_name FROM technologies t
           JOIN project_technologies pt ON t.id = pt.technology_id
           WHERE pt.project_id = ?`
        )
        .bind(project.id)
        .all(),
    ]);

    return successResponse({
      ...project,
      images: images.results || [],
      links: links.results || [],
      technologies: technologies.results || [],
    });
  } catch (error) {
    console.error('Get project error:', error);
    return errorResponse('Error al obtener proyecto', 500);
  }
}

export async function createProject(
  request: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  if (!auth.isAuthenticated) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const data = await request.json() as Partial<Project>;

    // Validar
    const errors = validateProjectData({
      slug: data.slug || '',
      title: data.title || '',
      short_description: data.short_description || '',
    });

    if (errors.length > 0) {
      return errorResponse(`Validación fallida: ${errors[0].message}`);
    }

    // Verificar que slug no existe
    const exists = await env.portfolio_database
      .prepare('SELECT id FROM projects WHERE slug = ? LIMIT 1')
      .bind(data.slug)
      .first();

    if (exists) {
      return errorResponse('El slug ya existe');
    }

    // Sanitizar inputs
    const sanitized = {
      slug: data.slug!.toLowerCase(),
      title: sanitizeInput(data.title || ''),
      short_description: sanitizeInput(data.short_description || ''),
      full_description: data.full_description ? sanitizeInput(data.full_description) : null,
      role: data.role ? sanitizeInput(data.role) : null,
      category: data.category || 'web',
      status: data.status || 'draft',
      cover_image_url: data.cover_image_url || null,
      demo_url: data.demo_url || null,
      repository_url: data.repository_url || null,
    };

    // Insertar
    const result = await env.portfolio_database
      .prepare(
        `INSERT INTO projects (
          slug, title, short_description, full_description, role, category, status,
          cover_image_url, demo_url, repository_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        sanitized.slug,
        sanitized.title,
        sanitized.short_description,
        sanitized.full_description,
        sanitized.role,
        sanitized.category,
        sanitized.status,
        sanitized.cover_image_url,
        sanitized.demo_url,
        sanitized.repository_url
      )
      .run();

    return successResponse(
      { id: result.meta.last_row_id, ...sanitized },
      'Proyecto creado exitosamente',
      201
    );
  } catch (error) {
    console.error('Create project error:', error);
    return errorResponse('Error al crear proyecto', 500);
  }
}

export async function updateProject(
  request: Request,
  env: Env,
  auth: AuthContext,
  projectId: number
): Promise<Response> {
  if (!auth.isAuthenticated) {
    return errorResponse('No autorizado', 401);
  }

  try {
    // Verificar que existe
    const project = await env.portfolio_database
      .prepare('SELECT id FROM projects WHERE id = ?')
      .bind(projectId)
      .first();

    if (!project) {
      return errorResponse('Proyecto no encontrado', 404);
    }

    const data = await request.json() as Partial<Project>;

    // Preparar actualización
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title) {
      updates.push('title = ?');
      values.push(sanitizeInput(data.title));
    }
    if (data.short_description) {
      updates.push('short_description = ?');
      values.push(sanitizeInput(data.short_description));
    }
    if (data.full_description) {
      updates.push('full_description = ?');
      values.push(sanitizeInput(data.full_description));
    }
    if (data.status) {
      updates.push('status = ?');
      values.push(data.status);
    }
    if (data.category) {
      updates.push('category = ?');
      values.push(data.category);
    }

    if (updates.length === 0) {
      return errorResponse('No hay campos para actualizar');
    }

    values.push(projectId);

    const result = await env.portfolio_database
      .prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    return successResponse({ updated: result.meta.changes }, 'Proyecto actualizado exitosamente');
  } catch (error) {
    console.error('Update project error:', error);
    return errorResponse('Error al actualizar proyecto', 500);
  }
}

export async function deleteProject(
  request: Request,
  env: Env,
  auth: AuthContext,
  projectId: number
): Promise<Response> {
  if (!auth.isAuthenticated) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const result = await env.portfolio_database
      .prepare('DELETE FROM projects WHERE id = ?')
      .bind(projectId)
      .run();

    if (result.meta.changes === 0) {
      return errorResponse('Proyecto no encontrado', 404);
    }

    return successResponse({ deleted: true }, 'Proyecto eliminado exitosamente');
  } catch (error) {
    console.error('Delete project error:', error);
    return errorResponse('Error al eliminar proyecto', 500);
  }
}
