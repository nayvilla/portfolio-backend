import { Env, ContactMessage, PaginatedResponse } from '../../shared/types';
import { sanitizeInput } from '../../shared/utils/validators';
import { generateHash } from '../../shared/utils/hash';
import { ContactRepository } from './contact.repository';
import { CreateContactInput, PURPOSE_LABELS, ContactPurpose } from './contact.validator';
import { createNotificationService, NotificationChannel } from '../../shared/utils/notifications';

export class ContactService {
  private repository: ContactRepository;

  constructor(private env: Env) {
    this.repository = new ContactRepository(env.portfolio_database);
  }

  async list(options: {
    page: number;
    limit: number;
    status?: string;
  }): Promise<PaginatedResponse<ContactMessage>> {
    const [messages, total] = await Promise.all([
      this.repository.findAll(options),
      this.repository.countAll(options.status),
    ]);

    return {
      data: messages,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  async getById(id: number): Promise<ContactMessage | null> {
    return this.repository.findById(id);
  }

  async create(data: CreateContactInput, ip: string, userAgent?: string): Promise<{ id: number; rateLimit: boolean }> {
    const ipHash = await generateHash(ip);

    // Rate limit: max 5 mensajes por hora por IP
    const recentCount = await this.repository.countByIp(ipHash, 60);
    if (recentCount >= 5) {
      return { id: 0, rateLimit: true };
    }

    const sanitized = {
      name: sanitizeInput(data.name),
      email: data.email.toLowerCase().trim(),
      subject: data.subject ? sanitizeInput(data.subject) : undefined,
      message: sanitizeInput(data.message),
      purpose: data.purpose,
      ip_hash: ipHash,
      user_agent: userAgent?.substring(0, 500),
    };

    const id = await this.repository.create(sanitized);

    // Enviar notificaciones a canales habilitados
    await this.sendNotifications(id, sanitized);

    return { id, rateLimit: false };
  }

  private async sendNotifications(messageId: number, data: { name: string; email: string; message: string; subject?: string; purpose?: ContactPurpose }) {
    const notificationService = createNotificationService(this.env as unknown as Record<string, string>);
    
    const channels: NotificationChannel[] = ['email', 'telegram', 'discord', 'webhook'];
    
    for (const channel of channels) {
      // Crear registro de notificación pendiente
      const notificationId = await this.repository.createNotification(messageId, channel);
      
      try {
        // Construir metadata dinámicamente
        const metadata: Record<string, string> = {
          'De': data.name,
          'Email': data.email,
          'Asunto': data.subject || 'Sin asunto',
        };
        
        // Solo agregar propósito si fue especificado
        if (data.purpose) {
          metadata['Propósito'] = PURPOSE_LABELS[data.purpose];
        }

        const result = await notificationService.send(channel, {
          type: 'contact_message',
          title: `Nuevo mensaje de ${data.name}`,
          message: data.message,
          metadata,
        });

        if (result.success) {
          await this.repository.markNotificationSent(
            notificationId, 
            result.responseData ? JSON.stringify(result.responseData) : undefined
          );
        } else if (result.error && !result.error.includes('incompleta') && !result.error.includes('no configurad')) {
          // Solo marcar como fallido si es un error real, no de configuración faltante
          await this.repository.markNotificationFailed(notificationId, result.error);
        }
      } catch (error) {
        await this.repository.markNotificationFailed(
          notificationId, 
          error instanceof Error ? error.message : 'Error desconocido'
        );
      }
    }
  }

  async updateStatus(id: number, status: string): Promise<boolean> {
    const validStatuses = ['unread', 'read', 'replied', 'archived', 'spam'];
    if (!validStatuses.includes(status)) {
      throw new Error('Estado inválido');
    }

    const message = await this.repository.findById(id);
    if (!message) {
      throw new Error('Mensaje no encontrado');
    }
    return this.repository.updateStatus(id, status);
  }

  async markAsRead(id: number): Promise<boolean> {
    return this.repository.markAsRead(id);
  }

  async delete(id: number): Promise<boolean> {
    return this.repository.delete(id);
  }

  async getUnreadCount(): Promise<number> {
    return this.repository.getUnreadCount();
  }

  async getNotifications(messageId: number) {
    return this.repository.findNotifications(messageId);
  }
}
