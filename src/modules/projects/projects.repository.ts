import { Project, ProjectImage, ProjectLink, Technology } from '../../shared/types';

export class ProjectsRepository {
  constructor(private db: D1Database) {}

  // ========== PROJECTS ==========

  async findAll(options: { page: number; limit: number; status?: string; category?: string; includeDeleted?: boolean }): Promise<Project[]> {
    let query = 'SELECT * FROM projects WHERE deleted_at IS NULL';
    const binds: (string | number)[] = [];

    if (options.includeDeleted) {
      query = 'SELECT * FROM projects WHERE 1=1';
    }

    if (options.status) {
      query += ' AND status = ?';
      binds.push(options.status);
    }
    if (options.category) {
      query += ' AND category = ?';
      binds.push(options.category);
    }

    query += ' ORDER BY sort_order ASC, published_at DESC LIMIT ? OFFSET ?';
    binds.push(options.limit, (options.page - 1) * options.limit);

    const result = await this.db.prepare(query).bind(...binds).all<Project>();
    return result.results || [];
  }

  async countAll(status?: string, category?: string, includeDeleted?: boolean): Promise<number> {
    let query = 'SELECT COUNT(*) as total FROM projects WHERE deleted_at IS NULL';
    const binds: string[] = [];

    if (includeDeleted) {
      query = 'SELECT COUNT(*) as total FROM projects WHERE 1=1';
    }

    if (status) {
      query += ' AND status = ?';
      binds.push(status);
    }
    if (category) {
      query += ' AND category = ?';
      binds.push(category);
    }

    const result = await this.db.prepare(query).bind(...binds).first<{ total: number }>();
    return result?.total || 0;
  }

  async findBySlug(slug: string, includeDeleted?: boolean): Promise<Project | null> {
    const query = includeDeleted
      ? 'SELECT * FROM projects WHERE slug = ?'
      : 'SELECT * FROM projects WHERE slug = ? AND deleted_at IS NULL';
    return this.db.prepare(query).bind(slug).first<Project>();
  }

  async findById(id: number, includeDeleted?: boolean): Promise<Project | null> {
    const query = includeDeleted
      ? 'SELECT * FROM projects WHERE id = ?'
      : 'SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL';
    return this.db.prepare(query).bind(id).first<Project>();
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const result = await this.db
      .prepare('SELECT id FROM projects WHERE slug = ? LIMIT 1')
      .bind(slug)
      .first();
    return !!result;
  }

  async create(data: Partial<Project>): Promise<number> {
    const result = await this.db
      .prepare(`
        INSERT INTO projects (
          slug, title, short_description, full_description, role, category,
          status, cover_image_url, demo_url, repository_url, is_featured, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        data.slug,
        data.title,
        data.short_description,
        data.full_description || null,
        data.role || null,
        data.category || 'web',
        data.status || 'draft',
        data.cover_image_url || null,
        data.demo_url || null,
        data.repository_url || null,
        data.is_featured || 0,
        data.sort_order || 0
      )
      .run();
    return result.meta.last_row_id as number;
  }

  async update(id: number, data: Partial<Project>): Promise<boolean> {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    const allowedFields = [
      'title', 'short_description', 'full_description', 'role', 'category',
      'status', 'cover_image_url', 'demo_url', 'repository_url', 'is_featured',
      'sort_order', 'published_at'
    ];

    for (const field of allowedFields) {
      if (data[field as keyof Project] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field as keyof Project] as string | number | null);
      }
    }

    if (fields.length === 0) return false;

    values.push(id);
    const result = await this.db
      .prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
    return (result.meta.changes ?? 0) > 0;
  }

  // Soft delete - marca el proyecto como eliminado
  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .prepare('UPDATE projects SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL')
      .bind(id)
      .run();
    return (result.meta.changes ?? 0) > 0;
  }

  // Restaurar proyecto eliminado
  async restore(id: number): Promise<boolean> {
    const result = await this.db
      .prepare('UPDATE projects SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL')
      .bind(id)
      .run();
    return (result.meta.changes ?? 0) > 0;
  }

  // Eliminación permanente - usar con cuidado
  async hardDelete(id: number): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM projects WHERE id = ?')
      .bind(id)
      .run();
    return (result.meta.changes ?? 0) > 0;
  }

  // Obtener proyectos eliminados (papelera)
  async findDeleted(options: { page: number; limit: number }): Promise<Project[]> {
    const result = await this.db
      .prepare('SELECT * FROM projects WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC LIMIT ? OFFSET ?')
      .bind(options.limit, (options.page - 1) * options.limit)
      .all<Project>();
    return result.results || [];
  }

  async countDeleted(): Promise<number> {
    const result = await this.db
      .prepare('SELECT COUNT(*) as total FROM projects WHERE deleted_at IS NOT NULL')
      .first<{ total: number }>();
    return result?.total || 0;
  }

  async publish(id: number): Promise<boolean> {
    const result = await this.db
      .prepare("UPDATE projects SET status = 'published', published_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(id)
      .run();
    return (result.meta.changes ?? 0) > 0;
  }

  // ========== PROJECT IMAGES ==========

  async getImages(projectId: number): Promise<ProjectImage[]> {
    const result = await this.db
      .prepare('SELECT * FROM project_images WHERE project_id = ? ORDER BY sort_order ASC')
      .bind(projectId)
      .all<ProjectImage>();
    return result.results || [];
  }

  async addImage(projectId: number, imageUrl: string, altText?: string, sortOrder?: number): Promise<number> {
    const result = await this.db
      .prepare('INSERT INTO project_images (project_id, image_url, alt_text, sort_order) VALUES (?, ?, ?, ?)')
      .bind(projectId, imageUrl, altText || null, sortOrder || 0)
      .run();
    return result.meta.last_row_id as number;
  }

  async deleteImage(imageId: number): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM project_images WHERE id = ?')
      .bind(imageId)
      .run();
    return (result.meta.changes ?? 0) > 0;
  }

  // ========== PROJECT LINKS ==========

  async getLinks(projectId: number): Promise<ProjectLink[]> {
    const result = await this.db
      .prepare('SELECT * FROM project_links WHERE project_id = ? ORDER BY sort_order ASC')
      .bind(projectId)
      .all<ProjectLink>();
    return result.results || [];
  }

  async addLink(projectId: number, data: { linkType: string; label: string; url: string; sortOrder?: number }): Promise<number> {
    const result = await this.db
      .prepare('INSERT INTO project_links (project_id, link_type, label, url, sort_order) VALUES (?, ?, ?, ?, ?)')
      .bind(projectId, data.linkType, data.label, data.url, data.sortOrder || 0)
      .run();
    return result.meta.last_row_id as number;
  }

  async deleteLink(linkId: number): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM project_links WHERE id = ?')
      .bind(linkId)
      .run();
    return (result.meta.changes ?? 0) > 0;
  }

  // ========== PROJECT TECHNOLOGIES ==========

  async getTechnologies(projectId: number): Promise<Technology[]> {
    const result = await this.db
      .prepare(`
        SELECT t.* FROM technologies t
        JOIN project_technologies pt ON t.id = pt.technology_id
        WHERE pt.project_id = ?
      `)
      .bind(projectId)
      .all<Technology>();
    return result.results || [];
  }

  async addTechnology(projectId: number, technologyId: number): Promise<boolean> {
    try {
      await this.db
        .prepare('INSERT INTO project_technologies (project_id, technology_id) VALUES (?, ?)')
        .bind(projectId, technologyId)
        .run();
      return true;
    } catch {
      return false; // Ya existe
    }
  }

  async removeTechnology(projectId: number, technologyId: number): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM project_technologies WHERE project_id = ? AND technology_id = ?')
      .bind(projectId, technologyId)
      .run();
    return (result.meta.changes ?? 0) > 0;
  }

  // ========== PROJECT LIKES ==========

  async getLikesCount(projectId: number): Promise<number> {
    const result = await this.db
      .prepare('SELECT COUNT(*) as total FROM project_likes WHERE project_id = ?')
      .bind(projectId)
      .first<{ total: number }>();
    return result?.total || 0;
  }

  async hasLiked(projectId: number, visitorHash: string): Promise<boolean> {
    const result = await this.db
      .prepare('SELECT id FROM project_likes WHERE project_id = ? AND visitor_hash = ? LIMIT 1')
      .bind(projectId, visitorHash)
      .first();
    return !!result;
  }

  async addLike(projectId: number, visitorHash: string, ipHash?: string, userAgentHash?: string): Promise<boolean> {
    try {
      await this.db
        .prepare('INSERT INTO project_likes (project_id, visitor_hash, ip_hash, user_agent_hash) VALUES (?, ?, ?, ?)')
        .bind(projectId, visitorHash, ipHash || null, userAgentHash || null)
        .run();
      return true;
    } catch {
      return false; // Ya existe
    }
  }

  async removeLike(projectId: number, visitorHash: string): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM project_likes WHERE project_id = ? AND visitor_hash = ?')
      .bind(projectId, visitorHash)
      .run();
    return (result.meta.changes ?? 0) > 0;
  }
}
