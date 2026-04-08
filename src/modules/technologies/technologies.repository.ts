import { Technology } from '../../shared/types';

export class TechnologiesRepository {
  constructor(private db: D1Database) {}

  async findAll(category?: string): Promise<Technology[]> {
    let query = 'SELECT * FROM technologies';
    const binds: string[] = [];

    if (category) {
      query += ' WHERE category = ?';
      binds.push(category);
    }

    query += ' ORDER BY sort_order ASC, name ASC';

    const result = await this.db.prepare(query).bind(...binds).all<Technology>();
    return result.results || [];
  }

  async findById(id: number): Promise<Technology | null> {
    return this.db
      .prepare('SELECT * FROM technologies WHERE id = ?')
      .bind(id)
      .first<Technology>();
  }

  async findBySlug(slug: string): Promise<Technology | null> {
    return this.db
      .prepare('SELECT * FROM technologies WHERE slug = ?')
      .bind(slug)
      .first<Technology>();
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const result = await this.db
      .prepare('SELECT id FROM technologies WHERE slug = ? LIMIT 1')
      .bind(slug)
      .first();
    return !!result;
  }

  async create(data: Partial<Technology>): Promise<number> {
    const result = await this.db
      .prepare(`
        INSERT INTO technologies (slug, name, icon_url, category, proficiency_level, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(
        data.slug,
        data.name,
        data.icon_url || null,
        data.category || 'other',
        data.proficiency_level || 50,
        data.sort_order || 0
      )
      .run();
    return result.meta.last_row_id as number;
  }

  async update(id: number, data: Partial<Technology>): Promise<boolean> {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    const allowedFields = ['name', 'icon_url', 'category', 'proficiency_level', 'sort_order'];

    for (const field of allowedFields) {
      if (data[field as keyof Technology] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field as keyof Technology] as string | number | null);
      }
    }

    if (fields.length === 0) return false;

    values.push(id);
    const result = await this.db
      .prepare(`UPDATE technologies SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
    return (result.meta.changes ?? 0) > 0;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM technologies WHERE id = ?')
      .bind(id)
      .run();
    return (result.meta.changes ?? 0) > 0;
  }

  async getCategories(): Promise<string[]> {
    const result = await this.db
      .prepare('SELECT DISTINCT category FROM technologies ORDER BY category')
      .all<{ category: string }>();
    return (result.results || []).map(r => r.category);
  }
}
