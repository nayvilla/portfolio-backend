import { Env, Project, ProjectImage, ProjectLink, Technology, PaginatedResponse } from '../../shared/types';
import { sanitizeInput } from '../../shared/utils/validators';
import { ProjectsRepository } from './projects.repository';
import { CreateProjectInput, UpdateProjectInput } from './projects.validator';

export interface ProjectWithDetails extends Project {
  images: ProjectImage[];
  links: ProjectLink[];
  technologies: Technology[];
  likes_count: number;
}

export class ProjectsService {
  private repository: ProjectsRepository;

  constructor(private env: Env) {
    this.repository = new ProjectsRepository(env.portfolio_database);
  }

  async list(options: {
    page: number;
    limit: number;
    status?: string;
    category?: string;
  }): Promise<PaginatedResponse<Project>> {
    const [projects, total] = await Promise.all([
      this.repository.findAll(options),
      this.repository.countAll(options.status, options.category),
    ]);

    return {
      data: projects,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  async getBySlug(slug: string, includeDetails = true): Promise<ProjectWithDetails | null> {
    const project = await this.repository.findBySlug(slug);
    if (!project) return null;

    if (!includeDetails) {
      return { ...project, images: [], links: [], technologies: [], likes_count: 0 };
    }

    const [images, links, technologies, likesCount] = await Promise.all([
      this.repository.getImages(project.id),
      this.repository.getLinks(project.id),
      this.repository.getTechnologies(project.id),
      this.repository.getLikesCount(project.id),
    ]);

    return { ...project, images, links, technologies, likes_count: likesCount };
  }

  async getById(id: number): Promise<Project | null> {
    return this.repository.findById(id);
  }

  async create(data: CreateProjectInput): Promise<{ id: number; slug: string }> {
    const exists = await this.repository.existsBySlug(data.slug);
    if (exists) {
      throw new Error('El slug ya existe');
    }

    const sanitized: Partial<Project> = {
      slug: data.slug.toLowerCase(),
      title: sanitizeInput(data.title),
      short_description: sanitizeInput(data.short_description),
      full_description: data.full_description ? sanitizeInput(data.full_description) : null,
      role: data.role ? sanitizeInput(data.role) : null,
      category: data.category || 'web',
      status: (data.status as Project['status']) || 'draft',
      cover_image_url: data.cover_image_url || null,
      demo_url: data.demo_url || null,
      repository_url: data.repository_url || null,
      is_featured: data.is_featured || 0,
      sort_order: data.sort_order || 0,
    };

    const id = await this.repository.create(sanitized);
    return { id, slug: sanitized.slug! };
  }

  async update(id: number, data: UpdateProjectInput): Promise<boolean> {
    const project = await this.repository.findById(id);
    if (!project) {
      throw new Error('Proyecto no encontrado');
    }

    const sanitized: UpdateProjectInput = {};
    if (data.title) sanitized.title = sanitizeInput(data.title);
    if (data.short_description) sanitized.short_description = sanitizeInput(data.short_description);
    if (data.full_description) sanitized.full_description = sanitizeInput(data.full_description);
    if (data.role) sanitized.role = sanitizeInput(data.role);
    if (data.category) sanitized.category = data.category;
    if (data.status) sanitized.status = data.status;
    if (data.cover_image_url) sanitized.cover_image_url = data.cover_image_url;
    if (data.demo_url) sanitized.demo_url = data.demo_url;
    if (data.repository_url) sanitized.repository_url = data.repository_url;
    if (data.is_featured !== undefined) sanitized.is_featured = data.is_featured;
    if (data.sort_order !== undefined) sanitized.sort_order = data.sort_order;

    return this.repository.update(id, sanitized as Partial<Project>);
  }

  async delete(id: number): Promise<boolean> {
    return this.repository.delete(id);
  }

  async publish(id: number): Promise<boolean> {
    return this.repository.publish(id);
  }

  // ========== IMAGES ==========

  async addImage(projectId: number, imageUrl: string, altText?: string, sortOrder?: number): Promise<number> {
    const project = await this.repository.findById(projectId);
    if (!project) throw new Error('Proyecto no encontrado');
    return this.repository.addImage(projectId, imageUrl, altText, sortOrder);
  }

  async deleteImage(imageId: number): Promise<boolean> {
    return this.repository.deleteImage(imageId);
  }

  // ========== LINKS ==========

  async addLink(projectId: number, data: { linkType: string; label: string; url: string; sortOrder?: number }): Promise<number> {
    const project = await this.repository.findById(projectId);
    if (!project) throw new Error('Proyecto no encontrado');
    return this.repository.addLink(projectId, data);
  }

  async deleteLink(linkId: number): Promise<boolean> {
    return this.repository.deleteLink(linkId);
  }

  // ========== TECHNOLOGIES ==========

  async addTechnology(projectId: number, technologyId: number): Promise<boolean> {
    const project = await this.repository.findById(projectId);
    if (!project) throw new Error('Proyecto no encontrado');
    return this.repository.addTechnology(projectId, technologyId);
  }

  async removeTechnology(projectId: number, technologyId: number): Promise<boolean> {
    return this.repository.removeTechnology(projectId, technologyId);
  }

  // ========== LIKES ==========

  async toggleLike(projectId: number, visitorHash: string, ipHash?: string): Promise<{ liked: boolean; count: number }> {
    const hasLiked = await this.repository.hasLiked(projectId, visitorHash);
    
    if (hasLiked) {
      await this.repository.removeLike(projectId, visitorHash);
    } else {
      await this.repository.addLike(projectId, visitorHash, ipHash);
    }

    const count = await this.repository.getLikesCount(projectId);
    return { liked: !hasLiked, count };
  }

  async getLikesCount(projectId: number): Promise<number> {
    return this.repository.getLikesCount(projectId);
  }

  // ========== SOFT DELETE / TRASH ==========

  async listDeleted(options: { page: number; limit: number }): Promise<PaginatedResponse<Project>> {
    const [projects, total] = await Promise.all([
      this.repository.findDeleted(options),
      this.repository.countDeleted(),
    ]);

    return {
      data: projects,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  async restore(id: number): Promise<boolean> {
    return this.repository.restore(id);
  }

  async hardDelete(id: number): Promise<boolean> {
    return this.repository.hardDelete(id);
  }
}
