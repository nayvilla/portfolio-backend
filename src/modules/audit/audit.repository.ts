import { AuditLog, FailedLoginAttempt, CreateAuditInput, AuditListOptions } from './audit.types';

export class AuditRepository {
  constructor(private db: D1Database) {}

  // ========== AUDIT LOGS ==========

  async create(data: CreateAuditInput): Promise<number> {
    const result = await this.db
      .prepare(`
        INSERT INTO audit_logs (
          user_id, action, entity_type, entity_id, 
          old_values, new_values, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        data.userId || null,
        data.action,
        data.entityType,
        data.entityId || null,
        data.oldValues ? JSON.stringify(data.oldValues) : null,
        data.newValues ? JSON.stringify(data.newValues) : null,
        data.ipAddress || null,
        data.userAgent || null
      )
      .run();
    return result.meta.last_row_id as number;
  }

  async findAll(options: AuditListOptions): Promise<AuditLog[]> {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const binds: (string | number)[] = [];

    if (options.userId) {
      query += ' AND user_id = ?';
      binds.push(options.userId);
    }

    if (options.action) {
      query += ' AND action = ?';
      binds.push(options.action);
    }

    if (options.entityType) {
      query += ' AND entity_type = ?';
      binds.push(options.entityType);
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

    const result = await this.db.prepare(query).bind(...binds).all<AuditLog>();
    return result.results || [];
  }

  async countAll(options: Partial<AuditListOptions>): Promise<number> {
    let query = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1';
    const binds: (string | number)[] = [];

    if (options.userId) {
      query += ' AND user_id = ?';
      binds.push(options.userId);
    }

    if (options.action) {
      query += ' AND action = ?';
      binds.push(options.action);
    }

    if (options.entityType) {
      query += ' AND entity_type = ?';
      binds.push(options.entityType);
    }

    const result = await this.db.prepare(query).bind(...binds).first<{ total: number }>();
    return result?.total || 0;
  }

  async findById(id: number): Promise<AuditLog | null> {
    return this.db
      .prepare('SELECT * FROM audit_logs WHERE id = ?')
      .bind(id)
      .first<AuditLog>();
  }

  async findByEntity(entityType: string, entityId: number): Promise<AuditLog[]> {
    const result = await this.db
      .prepare(`
        SELECT * FROM audit_logs 
        WHERE entity_type = ? AND entity_id = ?
        ORDER BY created_at DESC
      `)
      .bind(entityType, entityId)
      .all<AuditLog>();
    return result.results || [];
  }

  async cleanup(olderThanDays: number): Promise<number> {
    const result = await this.db
      .prepare(`
        DELETE FROM audit_logs 
        WHERE created_at < datetime('now', '-' || ? || ' days')
      `)
      .bind(olderThanDays)
      .run();
    return result.meta.changes ?? 0;
  }

  // ========== FAILED LOGIN ATTEMPTS ==========

  async createFailedLogin(data: {
    username?: string;
    email?: string;
    ipAddress: string;
    userAgent?: string;
    reason?: string;
  }): Promise<number> {
    const result = await this.db
      .prepare(`
        INSERT INTO failed_login_attempts (username, email, ip_address, user_agent, reason)
        VALUES (?, ?, ?, ?, ?)
      `)
      .bind(
        data.username || null,
        data.email || null,
        data.ipAddress,
        data.userAgent || null,
        data.reason || null
      )
      .run();
    return result.meta.last_row_id as number;
  }

  async getRecentFailedAttempts(ipAddress: string, sinceMinutes: number): Promise<number> {
    const result = await this.db
      .prepare(`
        SELECT COUNT(*) as total FROM failed_login_attempts
        WHERE ip_address = ? AND created_at > datetime('now', '-' || ? || ' minutes')
      `)
      .bind(ipAddress, sinceMinutes)
      .first<{ total: number }>();
    return result?.total || 0;
  }

  async getFailedLoginList(options: { page: number; limit: number; ipAddress?: string }): Promise<FailedLoginAttempt[]> {
    let query = 'SELECT * FROM failed_login_attempts';
    const binds: (string | number)[] = [];

    if (options.ipAddress) {
      query += ' WHERE ip_address = ?';
      binds.push(options.ipAddress);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    binds.push(options.limit, (options.page - 1) * options.limit);

    const result = await this.db.prepare(query).bind(...binds).all<FailedLoginAttempt>();
    return result.results || [];
  }

  async cleanupFailedLogins(olderThanDays: number): Promise<number> {
    const result = await this.db
      .prepare(`
        DELETE FROM failed_login_attempts 
        WHERE created_at < datetime('now', '-' || ? || ' days')
      `)
      .bind(olderThanDays)
      .run();
    return result.meta.changes ?? 0;
  }

  // ========== STATISTICS ==========

  async getStats(days: number = 30): Promise<{
    totalLogs: number;
    byAction: Record<string, number>;
    byEntity: Record<string, number>;
    failedLogins: number;
  }> {
    const [totalResult, byActionResult, byEntityResult, failedResult] = await Promise.all([
      this.db
        .prepare(`
          SELECT COUNT(*) as total FROM audit_logs 
          WHERE created_at > datetime('now', '-' || ? || ' days')
        `)
        .bind(days)
        .first<{ total: number }>(),

      this.db
        .prepare(`
          SELECT action, COUNT(*) as count FROM audit_logs 
          WHERE created_at > datetime('now', '-' || ? || ' days')
          GROUP BY action
        `)
        .bind(days)
        .all<{ action: string; count: number }>(),

      this.db
        .prepare(`
          SELECT entity_type, COUNT(*) as count FROM audit_logs 
          WHERE created_at > datetime('now', '-' || ? || ' days')
          GROUP BY entity_type
        `)
        .bind(days)
        .all<{ entity_type: string; count: number }>(),

      this.db
        .prepare(`
          SELECT COUNT(*) as total FROM failed_login_attempts 
          WHERE created_at > datetime('now', '-' || ? || ' days')
        `)
        .bind(days)
        .first<{ total: number }>(),
    ]);

    const byAction: Record<string, number> = {};
    for (const row of byActionResult.results || []) {
      byAction[row.action] = row.count;
    }

    const byEntity: Record<string, number> = {};
    for (const row of byEntityResult.results || []) {
      byEntity[row.entity_type] = row.count;
    }

    return {
      totalLogs: totalResult?.total || 0,
      byAction,
      byEntity,
      failedLogins: failedResult?.total || 0,
    };
  }
}
