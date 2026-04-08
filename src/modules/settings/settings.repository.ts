import { SiteSetting } from '../../shared/types';

export class SettingsRepository {
  constructor(private db: D1Database) {}

  async findAll(): Promise<SiteSetting[]> {
    const result = await this.db
      .prepare('SELECT * FROM site_settings ORDER BY setting_key')
      .all<SiteSetting>();
    return result.results || [];
  }

  async findByKey(key: string): Promise<SiteSetting | null> {
    return this.db
      .prepare('SELECT * FROM site_settings WHERE setting_key = ?')
      .bind(key)
      .first<SiteSetting>();
  }

  async findByGroup(group: string): Promise<SiteSetting[]> {
    const result = await this.db
      .prepare('SELECT * FROM site_settings WHERE setting_group = ? ORDER BY setting_key')
      .bind(group)
      .all<SiteSetting>();
    return result.results || [];
  }

  async getValue(key: string): Promise<string | null> {
    const setting = await this.findByKey(key);
    return setting?.setting_value ?? null;
  }

  async upsert(key: string, value: string, valueType = 'string', group = 'general'): Promise<boolean> {
    const result = await this.db
      .prepare(`
        INSERT INTO site_settings (setting_key, setting_value, value_type, setting_group)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(setting_key) DO UPDATE SET
          setting_value = excluded.setting_value,
          value_type = excluded.value_type,
          setting_group = excluded.setting_group
      `)
      .bind(key, value, valueType, group)
      .run();
    return (result.meta.changes ?? 0) > 0 || result.meta.last_row_id !== undefined;
  }

  async delete(key: string): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM site_settings WHERE setting_key = ?')
      .bind(key)
      .run();
    return (result.meta.changes ?? 0) > 0;
  }

  async getGroups(): Promise<string[]> {
    const result = await this.db
      .prepare('SELECT DISTINCT setting_group FROM site_settings ORDER BY setting_group')
      .all<{ setting_group: string }>();
    return (result.results || []).map(r => r.setting_group);
  }

  async bulkUpsert(settings: Array<{ key: string; value: string; valueType?: string; group?: string }>): Promise<number> {
    let updated = 0;
    for (const setting of settings) {
      const success = await this.upsert(
        setting.key,
        setting.value,
        setting.valueType || 'string',
        setting.group || 'general'
      );
      if (success) updated++;
    }
    return updated;
  }
}
