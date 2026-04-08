import { Env, AdminUser } from '../../shared/types';
import { hashPassword, verifyPassword } from '../../shared/utils/hash';
import { createJWT } from '../../shared/utils/jwt';
import { AuthRepository } from './auth.repository';

export interface LoginResult {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export class AuthService {
  private repository: AuthRepository;

  constructor(private env: Env) {
    this.repository = new AuthRepository(env.portfolio_database);
  }

  async login(username: string, password: string): Promise<LoginResult> {
    const user = await this.repository.findByUsername(username);

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new Error('Credenciales inválidas');
    }

    if (!user.is_active) {
      throw new Error('Usuario desactivado');
    }

    const token = await createJWT(
      { id: user.id, username: user.username, email: user.email },
      this.env.JWT_SECRET,
      86400
    );

    return {
      token,
      user: { id: user.id, username: user.username, email: user.email },
    };
  }

  async register(username: string, email: string, password: string): Promise<{ id: number; username: string; email: string }> {
    const exists = await this.repository.existsByUsernameOrEmail(username, email);
    if (exists) {
      throw new Error('Usuario o email ya existe');
    }

    const passwordHash = await hashPassword(password);
    const id = await this.repository.create({ username, email, passwordHash });

    return { id, username, email };
  }

  async changePassword(userId: number, newPassword: string): Promise<boolean> {
    const passwordHash = await hashPassword(newPassword);
    return this.repository.updatePassword(userId, passwordHash);
  }

  async getProfile(userId: number): Promise<Omit<AdminUser, 'password_hash'> | null> {
    const user = await this.repository.findById(userId);
    if (!user) return null;

    const { password_hash, ...profile } = user;
    return profile;
  }
}
