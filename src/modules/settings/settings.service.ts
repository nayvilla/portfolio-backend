import { Env, SiteSetting } from '../../shared/types';
import { sanitizeInput } from '../../shared/utils/validators';
import { SettingsRepository } from './settings.repository';
import { SettingInput } from './settings.validator';

export interface ParsedSetting extends SiteSetting {
  parsed_value: string | number | boolean | object | null;
}

export class SettingsService {
  private repository: SettingsRepository;

  constructor(private env: Env) {
    this.repository = new SettingsRepository(env.portfolio_database);
  }

  async getAll(): Promise<ParsedSetting[]> {
    const settings = await this.repository.findAll();
    return settings.map(s => this.parseSetting(s));
  }

  async getByKey(key: string): Promise<ParsedSetting | null> {
    const setting = await this.repository.findByKey(key);
    if (!setting) return null;
    return this.parseSetting(setting);
  }

  async getByGroup(group: string): Promise<ParsedSetting[]> {
    const settings = await this.repository.findByGroup(group);
    return settings.map(s => this.parseSetting(s));
  }

  async getValue<T = string>(key: string, defaultValue?: T): Promise<T> {
    const setting = await this.repository.findByKey(key);
    if (!setting || setting.setting_value === null) return defaultValue as T;
    return this.parseValue(setting.setting_value, setting.value_type) as T;
  }

  async set(data: SettingInput): Promise<boolean> {
    const sanitizedValue = data.value_type === 'json' 
      ? data.value 
      : sanitizeInput(data.value);

    return this.repository.upsert(
      data.key,
      sanitizedValue,
      data.value_type || 'string',
      data.group || 'general'
    );
  }

  async bulkSet(settings: SettingInput[]): Promise<number> {
    const sanitized = settings.map(s => ({
      key: s.key,
      value: s.value_type === 'json' ? s.value : sanitizeInput(s.value),
      valueType: s.value_type || 'string',
      group: s.group || 'general',
    }));
    return this.repository.bulkUpsert(sanitized);
  }

  async delete(key: string): Promise<boolean> {
    return this.repository.delete(key);
  }

  async getGroups(): Promise<string[]> {
    return this.repository.getGroups();
  }

  // Helper: públicas (sin auth) - solo ciertos keys
  async getPublicSettings(): Promise<Record<string, ParsedSetting['parsed_value']>> {
    const publicKeys = [
      'site_title',
      'site_description',
      'owner_name',
      'owner_title',
      'owner_bio',
      'avatar_url',
      'resume_url',
      'social_github',
      'social_linkedin',
      'social_twitter',
      'social_email',
    ];

    const result: Record<string, ParsedSetting['parsed_value']> = {};
    for (const key of publicKeys) {
      const setting = await this.repository.findByKey(key);
      if (setting && setting.setting_value !== null) {
        result[key] = this.parseValue(setting.setting_value, setting.value_type);
      }
    }
    return result;
  }

  private parseSetting(setting: SiteSetting): ParsedSetting {
    return {
      ...setting,
      parsed_value: setting.setting_value !== null 
        ? this.parseValue(setting.setting_value, setting.value_type)
        : null,
    };
  }

  private parseValue(value: string, type: string): string | number | boolean | object {
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true' || value === '1';
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }
}
