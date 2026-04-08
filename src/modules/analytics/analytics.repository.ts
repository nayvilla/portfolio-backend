import { AnalyticsEvent } from '../../shared/types';

export interface AnalyticsSummary {
  total_events: number;
  unique_visitors: number;
  page_views: number;
  top_pages: Array<{ page_path: string; count: number }>;
  top_referrers: Array<{ referrer: string; count: number }>;
  events_by_type: Array<{ event_type: string; count: number }>;
}

export class AnalyticsRepository {
  constructor(private db: D1Database) {}

  async findAll(options: {
    page: number;
    limit: number;
    eventType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AnalyticsEvent[]> {
    let query = 'SELECT * FROM analytics_events WHERE 1=1';
    const binds: (string | number)[] = [];

    if (options.eventType) {
      query += ' AND event_type = ?';
      binds.push(options.eventType);
    }

    if (options.startDate) {
      query += ' AND created_at >= ?';
      binds.push(options.startDate);
    }

    if (options.endDate) {
      query += ' AND created_at <= ?';
      binds.push(options.endDate);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    binds.push(options.limit, (options.page - 1) * options.limit);

    const result = await this.db.prepare(query).bind(...binds).all<AnalyticsEvent>();
    return result.results || [];
  }

  async countAll(eventType?: string, startDate?: string, endDate?: string): Promise<number> {
    let query = 'SELECT COUNT(*) as total FROM analytics_events WHERE 1=1';
    const binds: string[] = [];

    if (eventType) {
      query += ' AND event_type = ?';
      binds.push(eventType);
    }

    if (startDate) {
      query += ' AND created_at >= ?';
      binds.push(startDate);
    }

    if (endDate) {
      query += ' AND created_at <= ?';
      binds.push(endDate);
    }

    const result = await this.db.prepare(query).bind(...binds).first<{ total: number }>();
    return result?.total || 0;
  }

  async create(data: {
    eventType: string;
    pagePath?: string;
    pageTitle?: string;
    referrer?: string;
    visitorHash?: string;
    ipHash?: string;
    userAgent?: string;
    country?: string;
    metadata?: string;
  }): Promise<number> {
    const result = await this.db
      .prepare(`
        INSERT INTO analytics_events (
          event_type, page_path, page_title, referrer,
          visitor_hash, ip_hash, user_agent, country, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        data.eventType,
        data.pagePath || null,
        data.pageTitle || null,
        data.referrer || null,
        data.visitorHash || null,
        data.ipHash || null,
        data.userAgent || null,
        data.country || null,
        data.metadata || null
      )
      .run();
    return result.meta.last_row_id as number;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM analytics_events WHERE id = ?')
      .bind(id)
      .run();
    return (result.meta.changes ?? 0) > 0;
  }

  async deleteOlderThan(days: number): Promise<number> {
    const result = await this.db
      .prepare("DELETE FROM analytics_events WHERE created_at < datetime('now', '-' || ? || ' days')")
      .bind(days)
      .run();
    return result.meta.changes ?? 0;
  }

  async getSummary(startDate?: string, endDate?: string): Promise<AnalyticsSummary> {
    let dateFilter = '';
    const binds: string[] = [];

    if (startDate) {
      dateFilter += ' AND created_at >= ?';
      binds.push(startDate);
    }
    if (endDate) {
      dateFilter += ' AND created_at <= ?';
      binds.push(endDate);
    }

    // Total events
    const totalResult = await this.db
      .prepare(`SELECT COUNT(*) as total FROM analytics_events WHERE 1=1${dateFilter}`)
      .bind(...binds)
      .first<{ total: number }>();

    // Unique visitors
    const visitorsResult = await this.db
      .prepare(`SELECT COUNT(DISTINCT visitor_hash) as total FROM analytics_events WHERE visitor_hash IS NOT NULL${dateFilter}`)
      .bind(...binds)
      .first<{ total: number }>();

    // Page views
    const pageViewsResult = await this.db
      .prepare(`SELECT COUNT(*) as total FROM analytics_events WHERE event_type = 'page_view'${dateFilter}`)
      .bind(...binds)
      .first<{ total: number }>();

    // Top pages
    const topPagesResult = await this.db
      .prepare(`
        SELECT page_path, COUNT(*) as count
        FROM analytics_events
        WHERE page_path IS NOT NULL AND event_type = 'page_view'${dateFilter}
        GROUP BY page_path
        ORDER BY count DESC
        LIMIT 10
      `)
      .bind(...binds)
      .all<{ page_path: string; count: number }>();

    // Top referrers
    const topReferrersResult = await this.db
      .prepare(`
        SELECT referrer, COUNT(*) as count
        FROM analytics_events
        WHERE referrer IS NOT NULL AND referrer != ''${dateFilter}
        GROUP BY referrer
        ORDER BY count DESC
        LIMIT 10
      `)
      .bind(...binds)
      .all<{ referrer: string; count: number }>();

    // Events by type
    const eventsByTypeResult = await this.db
      .prepare(`
        SELECT event_type, COUNT(*) as count
        FROM analytics_events
        WHERE 1=1${dateFilter}
        GROUP BY event_type
        ORDER BY count DESC
      `)
      .bind(...binds)
      .all<{ event_type: string; count: number }>();

    return {
      total_events: totalResult?.total || 0,
      unique_visitors: visitorsResult?.total || 0,
      page_views: pageViewsResult?.total || 0,
      top_pages: topPagesResult.results || [],
      top_referrers: topReferrersResult.results || [],
      events_by_type: eventsByTypeResult.results || [],
    };
  }

  async getEventTypes(): Promise<string[]> {
    const result = await this.db
      .prepare('SELECT DISTINCT event_type FROM analytics_events ORDER BY event_type')
      .all<{ event_type: string }>();
    return (result.results || []).map(r => r.event_type);
  }
}
