import type { EnvConfig } from '../config/env';

export interface DatabaseConnectionConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: {
    rejectUnauthorized: boolean;
  };
}

function createSslConfig(sslMode: string | undefined): DatabaseConnectionConfig['ssl'] {
  if (!sslMode) {
    return undefined;
  }

  switch (sslMode.trim().toUpperCase()) {
    case 'DISABLED':
      return undefined;
    case 'REQUIRED':
      return { rejectUnauthorized: false };
    case 'VERIFY_CA':
    case 'VERIFY_IDENTITY':
      return { rejectUnauthorized: true };
    default:
      throw new Error(`Unsupported DB_SSL_MODE value: ${sslMode}`);
  }
}

export function createDatabaseConfig(env: EnvConfig): DatabaseConnectionConfig {
  const ssl = createSslConfig(env.dbSslMode);

  if (env.databaseUrl) {
    const url = new URL(env.databaseUrl);
    const database = url.pathname.replace(/^\//, '');

    if (url.protocol !== 'mysql:') {
      throw new Error('DATABASE_URL must use the mysql protocol');
    }

    if (!database) {
      throw new Error('DATABASE_URL must include a database name');
    }

    return {
      host: url.hostname,
      port: url.port ? Number.parseInt(url.port, 10) : 3306,
      database,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      ssl,
    };
  }

  if (!env.dbHost || !env.dbPort || !env.dbName || !env.dbUser || !env.dbPassword) {
    throw new Error(
      'Database configuration requires either DATABASE_URL or DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD',
    );
  }

  return {
    host: env.dbHost,
    port: env.dbPort,
    database: env.dbName,
    user: env.dbUser,
    password: env.dbPassword,
    ssl,
  };
}
