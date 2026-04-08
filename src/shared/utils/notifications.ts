// Servicio de notificaciones multi-canal
// Soporta: Email, Webhook, Telegram, Discord

export type NotificationChannel = 'email' | 'telegram' | 'discord' | 'webhook';

export interface NotificationConfig {
  email?: {
    enabled: boolean;
    apiKey?: string;        // Para servicios como SendGrid, Resend, etc.
    fromEmail?: string;
    toEmail?: string;
  };
  telegram?: {
    enabled: boolean;
    botToken?: string;
    chatId?: string;
  };
  discord?: {
    enabled: boolean;
    webhookUrl?: string;
  };
  webhook?: {
    enabled: boolean;
    url?: string;
    secret?: string;
  };
}

export interface NotificationPayload {
  type: 'contact_message' | 'new_user' | 'error_alert' | 'custom';
  title: string;
  message: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface NotificationResult {
  channel: NotificationChannel;
  success: boolean;
  error?: string;
  responseData?: unknown;
}

export class NotificationService {
  private config: NotificationConfig;

  constructor(config: NotificationConfig) {
    this.config = config;
  }

  // Enviar notificación a todos los canales habilitados
  async sendAll(payload: NotificationPayload): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    if (this.config.email?.enabled) {
      results.push(await this.sendEmail(payload));
    }

    if (this.config.telegram?.enabled) {
      results.push(await this.sendTelegram(payload));
    }

    if (this.config.discord?.enabled) {
      results.push(await this.sendDiscord(payload));
    }

    if (this.config.webhook?.enabled) {
      results.push(await this.sendWebhook(payload));
    }

    return results;
  }

  // Enviar a un canal específico
  async send(channel: NotificationChannel, payload: NotificationPayload): Promise<NotificationResult> {
    switch (channel) {
      case 'email':
        return this.sendEmail(payload);
      case 'telegram':
        return this.sendTelegram(payload);
      case 'discord':
        return this.sendDiscord(payload);
      case 'webhook':
        return this.sendWebhook(payload);
      default:
        return { channel, success: false, error: 'Canal no soportado' };
    }
  }

  // Email (usando API genérica - compatible con SendGrid, Resend, etc.)
  private async sendEmail(payload: NotificationPayload): Promise<NotificationResult> {
    const { email } = this.config;
    
    if (!email?.apiKey || !email?.fromEmail || !email?.toEmail) {
      return { channel: 'email', success: false, error: 'Configuración de email incompleta' };
    }

    try {
      // Ejemplo usando Resend API (puedes cambiar a SendGrid u otro)
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${email.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: email.fromEmail,
          to: email.toEmail,
          subject: `[Portfolio] ${payload.title}`,
          html: this.formatEmailHtml(payload),
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        return { channel: 'email', success: false, error: errorData };
      }

      const data = await response.json();
      return { channel: 'email', success: true, responseData: data };
    } catch (error) {
      return { 
        channel: 'email', 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  // Telegram Bot
  private async sendTelegram(payload: NotificationPayload): Promise<NotificationResult> {
    const { telegram } = this.config;
    
    if (!telegram?.botToken || !telegram?.chatId) {
      return { channel: 'telegram', success: false, error: 'Configuración de Telegram incompleta' };
    }

    try {
      const text = this.formatTelegramMessage(payload);
      const url = `https://api.telegram.org/bot${telegram.botToken}/sendMessage`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegram.chatId,
          text,
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        return { channel: 'telegram', success: false, error: errorData };
      }

      const data = await response.json();
      return { channel: 'telegram', success: true, responseData: data };
    } catch (error) {
      return { 
        channel: 'telegram', 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  // Discord Webhook
  private async sendDiscord(payload: NotificationPayload): Promise<NotificationResult> {
    const { discord } = this.config;
    
    if (!discord?.webhookUrl) {
      return { channel: 'discord', success: false, error: 'Webhook de Discord no configurado' };
    }

    try {
      const response = await fetch(discord.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: `📬 ${payload.title}`,
            description: payload.message,
            color: this.getDiscordColor(payload.type),
            fields: payload.metadata ? Object.entries(payload.metadata).map(([name, value]) => ({
              name,
              value: String(value),
              inline: true,
            })) : [],
            timestamp: new Date().toISOString(),
          }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        return { channel: 'discord', success: false, error: errorData };
      }

      return { channel: 'discord', success: true };
    } catch (error) {
      return { 
        channel: 'discord', 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  // Webhook genérico
  private async sendWebhook(payload: NotificationPayload): Promise<NotificationResult> {
    const { webhook } = this.config;
    
    if (!webhook?.url) {
      return { channel: 'webhook', success: false, error: 'URL de webhook no configurada' };
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      // Agregar firma HMAC si hay secret configurado
      if (webhook.secret) {
        const body = JSON.stringify(payload);
        const signature = await this.generateHmacSignature(body, webhook.secret);
        headers['X-Webhook-Signature'] = signature;
      }

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          event: payload.type,
          data: {
            title: payload.title,
            message: payload.message,
            metadata: payload.metadata,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        return { channel: 'webhook', success: false, error: errorData };
      }

      return { channel: 'webhook', success: true };
    } catch (error) {
      return { 
        channel: 'webhook', 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  // Helpers

  private formatEmailHtml(payload: NotificationPayload): string {
    let metadataHtml = '';
    if (payload.metadata) {
      metadataHtml = '<table style="border-collapse: collapse; margin-top: 16px;">';
      for (const [key, value] of Object.entries(payload.metadata)) {
        metadataHtml += `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${key}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${value}</td>
          </tr>
        `;
      }
      metadataHtml += '</table>';
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">${payload.title}</h1>
            </div>
            <div class="content">
              <p>${payload.message.replace(/\n/g, '<br>')}</p>
              ${metadataHtml}
            </div>
            <div class="footer">
              <p>Este es un mensaje automático del Portfolio Backend.</p>
              <p>Fecha: ${new Date().toLocaleString('es-ES')}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private formatTelegramMessage(payload: NotificationPayload): string {
    let text = `<b>📬 ${payload.title}</b>\n\n${payload.message}`;
    
    if (payload.metadata) {
      text += '\n\n<b>Detalles:</b>';
      for (const [key, value] of Object.entries(payload.metadata)) {
        text += `\n• <b>${key}:</b> ${value}`;
      }
    }
    
    text += `\n\n<i>📅 ${new Date().toLocaleString('es-ES')}</i>`;
    return text;
  }

  private getDiscordColor(type: NotificationPayload['type']): number {
    switch (type) {
      case 'contact_message': return 0x4F46E5; // Indigo
      case 'new_user': return 0x10B981;        // Green
      case 'error_alert': return 0xEF4444;     // Red
      default: return 0x6B7280;                // Gray
    }
  }

  private async generateHmacSignature(body: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

// Factory para crear el servicio desde variables de entorno
export function createNotificationService(env: {
  NOTIFICATION_EMAIL_ENABLED?: string;
  NOTIFICATION_EMAIL_API_KEY?: string;
  NOTIFICATION_EMAIL_FROM?: string;
  NOTIFICATION_EMAIL_TO?: string;
  NOTIFICATION_TELEGRAM_ENABLED?: string;
  NOTIFICATION_TELEGRAM_BOT_TOKEN?: string;
  NOTIFICATION_TELEGRAM_CHAT_ID?: string;
  NOTIFICATION_DISCORD_ENABLED?: string;
  NOTIFICATION_DISCORD_WEBHOOK_URL?: string;
  NOTIFICATION_WEBHOOK_ENABLED?: string;
  NOTIFICATION_WEBHOOK_URL?: string;
  NOTIFICATION_WEBHOOK_SECRET?: string;
}): NotificationService {
  return new NotificationService({
    email: {
      enabled: env.NOTIFICATION_EMAIL_ENABLED === 'true',
      apiKey: env.NOTIFICATION_EMAIL_API_KEY,
      fromEmail: env.NOTIFICATION_EMAIL_FROM,
      toEmail: env.NOTIFICATION_EMAIL_TO,
    },
    telegram: {
      enabled: env.NOTIFICATION_TELEGRAM_ENABLED === 'true',
      botToken: env.NOTIFICATION_TELEGRAM_BOT_TOKEN,
      chatId: env.NOTIFICATION_TELEGRAM_CHAT_ID,
    },
    discord: {
      enabled: env.NOTIFICATION_DISCORD_ENABLED === 'true',
      webhookUrl: env.NOTIFICATION_DISCORD_WEBHOOK_URL,
    },
    webhook: {
      enabled: env.NOTIFICATION_WEBHOOK_ENABLED === 'true',
      url: env.NOTIFICATION_WEBHOOK_URL,
      secret: env.NOTIFICATION_WEBHOOK_SECRET,
    },
  });
}
