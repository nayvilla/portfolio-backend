import { Env, AnalyticsEvent, PaginatedResponse } from '../../shared/types';
import { generateHash } from '../../shared/utils/hash';
import { sanitizeInput } from '../../shared/utils/validators';
import { AnalyticsRepository, AnalyticsSummary } from './analytics.repository';
import { TrackEventInput } from './analytics.validator';

export class AnalyticsService {
  private repository: AnalyticsRepository;

  constructor(private env: Env) {
    this.repository = new AnalyticsRepository(env.portfolio_database);
  }

  async list(options: {
    page: number;
    limit: number;
    eventType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<AnalyticsEvent>> {
    const [events, total] = await Promise.all([
      this.repository.findAll(options),
      this.repository.countAll(options.eventType, options.startDate, options.endDate),
    ]);

    return {
      data: events,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  async track(data: TrackEventInput, ip: string, userAgent?: string): Promise<number> {
    const visitorHash = await generateHash(ip + (userAgent || ''));
    const ipHash = await generateHash(ip);

    const eventData = {
      eventType: data.event_type,
      pagePath: data.page_path ? sanitizeInput(data.page_path) : undefined,
      pageTitle: data.page_title ? sanitizeInput(data.page_title) : undefined,
      referrer: data.referrer ? sanitizeInput(data.referrer) : undefined,
      visitorHash,
      ipHash,
      userAgent: userAgent?.substring(0, 500),
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
    };

    return this.repository.create(eventData);
  }

  async getSummary(startDate?: string, endDate?: string): Promise<AnalyticsSummary> {
    return this.repository.getSummary(startDate, endDate);
  }

  async delete(id: number): Promise<boolean> {
    return this.repository.delete(id);
  }

  async cleanup(days: number): Promise<number> {
    return this.repository.deleteOlderThan(days);
  }

  async getEventTypes(): Promise<string[]> {
    return this.repository.getEventTypes();
  }
}
