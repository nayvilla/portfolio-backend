import { ContactMessage, ContactNotification } from '../../shared/types';

export class ContactRepository {
  constructor(private db: D1Database) {}

  // ========== MESSAGES ==========

  async findAll(options: { page: number; limit: number; status?: string }): Promise<ContactMessage[]> {
    let query = 'SELECT * FROM contact_messages';
    const binds: (string | number)[] = [];

    if (options.status) {
      query += ' WHERE status = ?';
      binds.push(options.status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    binds.push(options.limit, (options.page - 1) * options.limit);

    const result = await this.db.prepare(query).bind(...binds).all<ContactMessage>();
    return result.results || [];
  }

  async countAll(status?: string): Promise<number> {
    let query = 'SELECT COUNT(*) as total FROM contact_messages';
    const binds: string[] = [];

    if (status) {
      query += ' WHERE status = ?';
      binds.push(status);
    }

    const result = await this.db.prepare(query).bind(...binds).first<{ total: number }>();
    return result?.total || 0;
  }

  async findById(id: number): Promise<ContactMessage | null> {
    return this.db
      .prepare('SELECT * FROM contact_messages WHERE id = ?')
      .bind(id)
      .first<ContactMessage>();
  }

  async create(data: {
    name: string;
    email: string;
    subject?: string;
    message: string;
    purpose?: string;
    ip_hash?: string;
    user_agent?: string;
  }): Promise<number> {
    const result = await this.db
      .prepare(`
        INSERT INTO contact_messages (name, email, subject, message, purpose, ip_hash, user_agent, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'unread')
      `)
      .bind(
        data.name,
        data.email,
        data.subject || null,
        data.message,
        data.purpose || null,
        data.ip_hash || null,
        data.user_agent || null
      )
      .run();
    return result.meta.last_row_id as number;
  }

  async updateStatus(id: number, status: string): Promise<boolean> {
    let query = 'UPDATE contact_messages SET status = ?';
    const binds: (string | number)[] = [status];

    if (status === 'read') {
      query += ', read_at = CURRENT_TIMESTAMP';
    } else if (status === 'replied') {
      query += ', replied_at = CURRENT_TIMESTAMP';
    }

    query += ' WHERE id = ?';
    binds.push(id);

    const result = await this.db.prepare(query).bind(...binds).run();
    return (result.meta.changes ?? 0) > 0;
  }

  async markAsRead(id: number): Promise<boolean> {
    return this.updateStatus(id, 'read');
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM contact_messages WHERE id = ?')
      .bind(id)
      .run();
    return (result.meta.changes ?? 0) > 0;
  }

  async countByIp(ipHash: string, sinceMinutes: number): Promise<number> {
    const result = await this.db
      .prepare(`
        SELECT COUNT(*) as total FROM contact_messages
        WHERE ip_hash = ? AND created_at > datetime('now', '-' || ? || ' minutes')
      `)
      .bind(ipHash, sinceMinutes)
      .first<{ total: number }>();
    return result?.total || 0;
  }

  // ========== NOTIFICATIONS ==========

  async findNotifications(messageId: number): Promise<ContactNotification[]> {
    const result = await this.db
      .prepare('SELECT * FROM contact_notifications WHERE message_id = ? ORDER BY created_at DESC')
      .bind(messageId)
      .all<ContactNotification>();
    return result.results || [];
  }

  async createNotification(
    messageId: number, 
    channel: 'email' | 'telegram' | 'discord' | 'webhook'
  ): Promise<number> {
    const result = await this.db
      .prepare(`
        INSERT INTO contact_notifications (message_id, channel, status) 
        VALUES (?, ?, 'pending')
      `)
      .bind(messageId, channel)
      .run();
    return result.meta.last_row_id as number;
  }

  async markNotificationSent(id: number, responseData?: string): Promise<boolean> {
    const result = await this.db
      .prepare(`
        UPDATE contact_notifications 
        SET status = 'sent', sent_at = CURRENT_TIMESTAMP, response_data = ?
        WHERE id = ?
      `)
      .bind(responseData || null, id)
      .run();
    return (result.meta.changes ?? 0) > 0;
  }

  async markNotificationFailed(id: number, errorMessage: string): Promise<boolean> {
    const result = await this.db
      .prepare(`
        UPDATE contact_notifications 
        SET status = 'failed', error_message = ?
        WHERE id = ?
      `)
      .bind(errorMessage, id)
      .run();
    return (result.meta.changes ?? 0) > 0;
  }

  async getPendingNotifications(): Promise<Array<ContactNotification & { name: string; email: string; message: string }>>  {
    const result = await this.db
      .prepare(`
        SELECT cn.*, cm.name, cm.email, cm.subject, cm.message
        FROM contact_notifications cn
        JOIN contact_messages cm ON cn.message_id = cm.id
        WHERE cn.status = 'pending'
        ORDER BY cn.created_at ASC
      `)
      .all<ContactNotification & { name: string; email: string; message: string }>();
    return result.results || [];
  }

  async getUnreadCount(): Promise<number> {
    const result = await this.db
      .prepare("SELECT COUNT(*) as total FROM contact_messages WHERE status = 'unread'")
      .first<{ total: number }>();
    return result?.total || 0;
  }
}
