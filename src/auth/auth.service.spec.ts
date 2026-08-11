import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: Pick<JwtService, 'sign'>;

  const env: Record<string, string> = {
    ADMIN_EMAIL: 'admin@eduvia.com',
    ADMIN_PASSWORD: 'ChangeMe123!',
  };

  beforeEach(() => {
    const configService = {
      get: (key: string) => env[key],
    } as unknown as ConfigService;

    jwtService = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

    service = new AuthService(configService, jwtService as JwtService);
  });

  it('returns an access token for the correct admin credentials', async () => {
    const result = await service.login({
      email: 'admin@eduvia.com',
      password: 'ChangeMe123!',
    });

    expect(result.accessToken).toBe('signed.jwt.token');
    expect(result.user).toEqual({ id: 'admin', email: 'admin@eduvia.com' });
  });

  it('matches the admin email case-insensitively', async () => {
    const result = await service.login({
      email: 'ADMIN@eduvia.com',
      password: 'ChangeMe123!',
    });

    expect(result.user.email).toBe('admin@eduvia.com');
  });

  it('rejects an incorrect password', async () => {
    await expect(
      service.login({ email: 'admin@eduvia.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an unrecognized email', async () => {
    await expect(
      service.login({ email: 'someone-else@eduvia.com', password: 'ChangeMe123!' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
