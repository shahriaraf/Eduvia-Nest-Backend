import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedUser, JwtPayload } from './interfaces/jwt-payload.interface';

export interface LoginResult {
  accessToken: string;
  user: AuthenticatedUser;
}

/**
 * The assignment explicitly marks authentication as out of scope, so
 * this deliberately stops at "one admin account, configured via env
 * vars" rather than a full users table/registration flow — that keeps
 * the login real (hashed password check, signed JWT, guarded routes)
 * without over-building a feature nobody asked for.
 *
 * The admin password is hashed once, lazily, on first login attempt
 * (not stored pre-hashed) so `.env` only needs a single plain
 * `ADMIN_PASSWORD` value — consistent with how `DB_PASSWORD` is already
 * handled in this project for local/dev use.
 */
@Injectable()
export class AuthService {
  private static readonly ADMIN_ID = 'admin';
  private cachedPasswordHash: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResult> {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL')!;

    const emailMatches =
      dto.email.trim().toLowerCase() === adminEmail.toLowerCase();
    const passwordMatches = emailMatches
      ? await bcrypt.compare(dto.password, await this.getAdminPasswordHash())
      : false;

    if (!emailMatches || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const user: AuthenticatedUser = { id: AuthService.ADMIN_ID, email: adminEmail };
    const payload: JwtPayload = { sub: user.id, email: user.email };

    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }

  private async getAdminPasswordHash(): Promise<string> {
    if (!this.cachedPasswordHash) {
      const adminPassword = this.configService.get<string>('ADMIN_PASSWORD')!;
      this.cachedPasswordHash = await bcrypt.hash(adminPassword, 10);
    }
    return this.cachedPasswordHash;
  }
}
