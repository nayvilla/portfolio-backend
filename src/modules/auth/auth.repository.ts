import { Env, AdminUser } from '../../shared/types';

export class AuthRepository {
  constructor(private db: D1Database) {}

  async findByUsername(username: string): Promise<AdminUser | null> {
    return this.db
      .prepare('SELECT * FROM admin_users WHERE username = ? LIMIT 1')
      .bind(username)
      .first<AdminUser>();
  }

  async findByEmail(email: string): Promise<AdminUser | null> {
    return this.db
      .prepare('SELECT * FROM admin_users WHERE email = ? LIMIT 1')
      .bind(email)
      .first<AdminUser>();
  }

  async findById(id: number): Promise<AdminUser | null> {
    return this.db
      .prepare('SELECT * FROM admin_users WHERE id = ? LIMIT 1')
      .bind(id)
      .first<AdminUser>();
  }

  async existsByUsernameOrEmail(username: string, email: string): Promise<boolean> {
    const result = await this.db
      .prepare('SELECT id FROM admin_users WHERE username = ? OR email = ? LIMIT 1')
      .bind(username, email)
      .first();
    return !!result;
  }

  async create(data: { username: string; email: string; passwordHash: string }): Promise<number> {
    const result = await this.db
      .prepare(
        'INSERT INTO admin_users (username, email, password_hash, is_active) VALUES (?, ?, ?, 1)'
      )
      .bind(data.username, data.email, data.passwordHash)
      .run();
    return result.meta.last_row_id as number;
  }

  async updatePassword(id: number, passwordHash: string): Promise<boolean> {
    const result = await this.db
      .prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?')
      .bind(passwordHash, id)
      .run();
    return (result.meta.changes ?? 0) > 0;
  }

  async setActive(id: number, isActive: boolean): Promise<boolean> {
    const result = await this.db
      .prepare('UPDATE admin_users SET is_active = ? WHERE id = ?')
      .bind(isActive ? 1 : 0, id)
      .run();
    return (result.meta.changes ?? 0) > 0;
  }
}
