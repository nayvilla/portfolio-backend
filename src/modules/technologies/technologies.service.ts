import { Env, Technology } from '../../shared/types';
import { sanitizeInput } from '../../shared/utils/validators';
import { TechnologiesRepository } from './technologies.repository';
import { CreateTechnologyInput, UpdateTechnologyInput } from './technologies.validator';

export class TechnologiesService {
  private repository: TechnologiesRepository;

  constructor(private env: Env) {
    this.repository = new TechnologiesRepository(env.portfolio_database);
  }

  async list(category?: string): Promise<Technology[]> {
    return this.repository.findAll(category);
  }

  async getById(id: number): Promise<Technology | null> {
    return this.repository.findById(id);
  }

  async getBySlug(slug: string): Promise<Technology | null> {
    return this.repository.findBySlug(slug);
  }

  async create(data: CreateTechnologyInput): Promise<{ id: number; slug: string }> {
    const exists = await this.repository.existsBySlug(data.slug);
    if (exists) {
      throw new Error('El slug ya existe');
    }

    const sanitized = {
      slug: data.slug.toLowerCase(),
      name: sanitizeInput(data.name),
      icon_url: data.icon_url,
      category: data.category || 'other',
      proficiency_level: data.proficiency_level ?? 50,
      sort_order: data.sort_order ?? 0,
    };

    const id = await this.repository.create(sanitized);
    return { id, slug: sanitized.slug };
  }

  async update(id: number, data: UpdateTechnologyInput): Promise<boolean> {
    const tech = await this.repository.findById(id);
    if (!tech) {
      throw new Error('Tecnología no encontrada');
    }

    const sanitized: UpdateTechnologyInput = {};
    if (data.name) sanitized.name = sanitizeInput(data.name);
    if (data.icon_url !== undefined) sanitized.icon_url = data.icon_url;
    if (data.category) sanitized.category = data.category;
    if (data.proficiency_level !== undefined) sanitized.proficiency_level = data.proficiency_level;
    if (data.sort_order !== undefined) sanitized.sort_order = data.sort_order;

    return this.repository.update(id, sanitized as Partial<Technology>);
  }

  async delete(id: number): Promise<boolean> {
    return this.repository.delete(id);
  }

  async getCategories(): Promise<string[]> {
    return this.repository.getCategories();
  }
}
