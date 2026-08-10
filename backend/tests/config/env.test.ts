import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { loadEnv } from '../../src/config/env';

const envKeys = [
  'PORT',
  'DATABASE_URL',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'DB_SSL_MODE',
  'SESSION_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
];

function clearEnv() {
  for (const key of envKeys) {
    delete process.env[key];
  }
}

test('loadEnv reads the repo-root .env when the backend workspace has no local file', async () => {
  const rootDir = await mkdtemp(path.join(tmpdir(), 'bambu-env-root-'));
  const backendDir = path.join(rootDir, 'backend');

  try {
    await mkdir(backendDir, { recursive: true });
    await writeFile(
      path.join(rootDir, '.env'),
      [
        'PORT=4567',
        'DB_HOST=parent-host',
        'DB_PORT=25060',
        'DB_NAME=parent-db',
        'DB_USER=parent-user',
        'DB_PASSWORD=parent-password',
        'DB_SSL_MODE=REQUIRED',
      ].join('\n'),
    );

    clearEnv();

    const env = loadEnv(backendDir);

    assert.equal(env.port, 4567);
    assert.equal(env.dbHost, 'parent-host');
    assert.equal(env.dbPort, 25060);
    assert.equal(env.dbName, 'parent-db');
    assert.equal(env.dbUser, 'parent-user');
    assert.equal(env.dbPassword, 'parent-password');
    assert.equal(env.dbSslMode, 'REQUIRED');
  } finally {
    clearEnv();
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('loadEnv prefers the backend workspace .env over the repo-root .env', async () => {
  const rootDir = await mkdtemp(path.join(tmpdir(), 'bambu-env-prefer-local-'));
  const backendDir = path.join(rootDir, 'backend');

  try {
    await mkdir(backendDir, { recursive: true });
    await writeFile(
      path.join(rootDir, '.env'),
      ['DB_HOST=parent-host', 'DB_PORT=3306', 'DB_NAME=parent-db', 'DB_USER=parent-user', 'DB_PASSWORD=parent-password'].join('\n'),
    );
    await writeFile(
      path.join(backendDir, '.env'),
      ['DB_HOST=local-host', 'DB_PORT=25060', 'DB_NAME=local-db', 'DB_USER=local-user', 'DB_PASSWORD=local-password'].join('\n'),
    );

    clearEnv();

    const env = loadEnv(backendDir);

    assert.equal(env.dbHost, 'local-host');
    assert.equal(env.dbPort, 25060);
    assert.equal(env.dbName, 'local-db');
    assert.equal(env.dbUser, 'local-user');
    assert.equal(env.dbPassword, 'local-password');
  } finally {
    clearEnv();
    await rm(rootDir, { recursive: true, force: true });
  }
});
