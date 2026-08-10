import assert from 'node:assert/strict';
import test from 'node:test';
import type { EnvConfig } from '../../src/config/env';
import { createDatabaseConfig } from '../../src/database/config';

function createEnv(overrides: Partial<EnvConfig> = {}): EnvConfig {
  return {
    port: 3000,
    databaseUrl: undefined,
    dbHost: 'localhost',
    dbPort: 3306,
    dbName: 'bambu',
    dbUser: 'user',
    dbPassword: 'password',
    dbSslMode: undefined,
    ...overrides,
  };
}

test('createDatabaseConfig enables TLS when DB_SSL_MODE is REQUIRED', () => {
  const config = createDatabaseConfig(
    createEnv({
      dbHost: 'db.example.com',
      dbPort: 25060,
      dbName: 'bambudbo',
      dbUser: 'bambuadmin',
      dbPassword: 'secret',
      dbSslMode: 'REQUIRED',
    }),
  );

  assert.deepEqual(config, {
    host: 'db.example.com',
    port: 25060,
    database: 'bambudbo',
    user: 'bambuadmin',
    password: 'secret',
    ssl: {
      rejectUnauthorized: false,
    },
  });
});

test('createDatabaseConfig rejects unsupported DB_SSL_MODE values', () => {
  assert.throws(
    () =>
      createDatabaseConfig(
        createEnv({
          dbSslMode: 'SOMETHING_ELSE',
        }),
      ),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(error.message, 'Unsupported DB_SSL_MODE value: SOMETHING_ELSE');
      return true;
    },
  );
});
