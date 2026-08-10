import path from 'node:path';
import dotenv from 'dotenv';

export interface EnvConfig {
  port: number;
  databaseUrl: string | undefined;
  dbHost: string | undefined;
  dbPort: number | undefined;
  dbName: string | undefined;
  dbUser: string | undefined;
  dbPassword: string | undefined;
  dbSslMode: string | undefined;
  sessionSecret: string | undefined;
  googleCredentialsPath: string | undefined;
  googleClientId: string | undefined;
  googleClientSecret: string | undefined;
  googleCallbackUrl: string | undefined;
  authCookieSecure: boolean;
}

function parseOptionalPort(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid port value: ${value}`);
  }

  return parsed;
}

function loadDotEnv(cwd: string) {
  for (const envPath of [path.resolve(cwd, '.env'), path.resolve(cwd, '..', '.env')]) {
    dotenv.config({ path: envPath, override: false });
  }
}

export function loadEnv(cwd: string = process.cwd()): EnvConfig {
  loadDotEnv(cwd);

  return {
    port: parseOptionalPort(process.env.PORT) ?? 3000,
    databaseUrl: process.env.DATABASE_URL,
    dbHost: process.env.DB_HOST,
    dbPort: parseOptionalPort(process.env.DB_PORT),
    dbName: process.env.DB_NAME,
    dbUser: process.env.DB_USER,
    dbPassword: process.env.DB_PASSWORD,
    dbSslMode: process.env.DB_SSL_MODE,
    sessionSecret: process.env.SESSION_SECRET,
    googleCredentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL,
    authCookieSecure: process.env.AUTH_COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
  };
}
