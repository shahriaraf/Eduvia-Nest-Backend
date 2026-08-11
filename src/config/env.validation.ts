import { Type, plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * Strongly-typed representation of every environment variable the
 * application relies on. Validated once at bootstrap so the process
 * fails fast (with a clear message) instead of crashing later at
 * runtime with an obscure error.
 */
class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(65535)
  @IsOptional()
  PORT = 4000;

  @IsString()
  @IsOptional()
  API_PREFIX = 'api';

  @IsString()
  @IsOptional()
  CORS_ORIGIN = '*';

  @IsString()
  @IsOptional()
  DATABASE_URL?: string;

  @IsString()
  @IsOptional()
  DB_HOST = 'localhost';

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  DB_PORT = 5432;

  @IsString()
  @IsOptional()
  DB_USERNAME = 'postgres';

  @IsString()
  @IsOptional()
  DB_PASSWORD = 'postgres';

  @IsString()
  @IsOptional()
  DB_NAME = 'eduvia';

  @IsOptional()
  DB_SYNCHRONIZE?: string;

  @IsOptional()
  DB_SSL?: string;

  // --- Auth ---
  // Defaults are only sane for local development. Always override
  // JWT_SECRET and ADMIN_PASSWORD before deploying anywhere real.
  @IsString()
  @IsOptional()
  JWT_SECRET = 'dev-only-secret-change-me';

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN = '1d';

  @IsString()
  @IsOptional()
  ADMIN_EMAIL = 'admin@eduvia.com';

  @IsString()
  @IsOptional()
  ADMIN_PASSWORD = 'ChangeMe123!';
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const message = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Invalid environment configuration: ${message}`);
  }

  return validatedConfig;
}
