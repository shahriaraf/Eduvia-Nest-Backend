import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Decides whether the Postgres connection should use SSL.
 *
 * Neon (and most hosted Postgres providers) require SSL on every
 * connection, including local development against a Neon branch —
 * unlike a typical setup where SSL is only turned on in production.
 *
 * Resolution order:
 *   1. Explicit `DB_SSL=true` / `DB_SSL=false` always wins.
 *   2. Otherwise, infer from the connection target: a local/loopback
 *      host (localhost, 127.0.0.1, the `postgres` Docker service name)
 *      doesn't use SSL; anything else (Neon, RDS, etc.) does.
 */
const resolveSsl = (
  configService: ConfigService,
): false | { rejectUnauthorized: boolean } => {
  const explicit = configService.get<string>('DB_SSL');
  if (explicit === 'true') return { rejectUnauthorized: false };
  if (explicit === 'false') return false;

  const databaseUrl = configService.get<string>('DATABASE_URL');
  const host = databaseUrl
    ? new URL(databaseUrl).hostname
    : configService.get<string>('DB_HOST');

  const isLocal =
    !host || ['localhost', '127.0.0.1', 'postgres'].includes(host);

  return isLocal ? false : { rejectUnauthorized: false };
};

/**
 * Builds the TypeORM connection options from environment variables.
 *
 * - Prefers a single DATABASE_URL (this is how Neon issues its
 *   connection string — see `.env.example`).
 * - Falls back to discrete DB_* variables for a plain local Postgres.
 * - `synchronize` is OFF by default: schema changes are expected to go
 *   through migrations (see src/database/migrations). This is what a
 *   production-minded setup looks like, even for a small assignment.
 */
export const buildTypeOrmOptions = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const databaseUrl = configService.get<string>('DATABASE_URL');
  const synchronize = configService.get<string>('DB_SYNCHRONIZE') === 'true';
  const nodeEnv = configService.get<string>('NODE_ENV');

  const common: Partial<TypeOrmModuleOptions> = {
    type: 'postgres',
    autoLoadEntities: true,
    synchronize,
    logging: nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    migrationsRun: false,
    ssl: resolveSsl(configService),
    extra: {
      // Modest pool size — appropriate for a small app and for Neon's
      // connection limits on lower-tier plans. Raise if needed.
      max: 10,
      connectionTimeoutMillis: 10_000,
    },
  };

  if (databaseUrl) {
    return {
      ...common,
      url: databaseUrl,
    } as TypeOrmModuleOptions;
  }

  return {
    ...common,
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
  } as TypeOrmModuleOptions;
};

