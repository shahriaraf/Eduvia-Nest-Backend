import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

config();

const useUrl = !!process.env.DATABASE_URL;

/**
 * Mirrors the SSL resolution logic in src/config/typeorm.config.ts so
 * `npm run migration:run` connects to Neon (or any hosted Postgres)
 * the same way the running app does. Explicit DB_SSL wins; otherwise
 * a local/loopback host skips SSL and anything else uses it.
 */
const resolveSsl = (): false | { rejectUnauthorized: boolean } => {
  if (process.env.DB_SSL === 'true') return { rejectUnauthorized: false };
  if (process.env.DB_SSL === 'false') return false;

  const host = process.env.DATABASE_URL
    ? new URL(process.env.DATABASE_URL).hostname
    : process.env.DB_HOST;

  const isLocal = !host || ['localhost', '127.0.0.1', 'postgres'].includes(host);
  return isLocal ? false : { rejectUnauthorized: false };
};

const options: DataSourceOptions = {
  type: 'postgres',
  ...(useUrl
    ? { url: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5432),
        username: process.env.DB_USERNAME ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'postgres',
        database: process.env.DB_NAME ?? 'eduvia',
      }),
  ssl: resolveSsl(),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
};

export const AppDataSource = new DataSource(options);

