import mysql, { type Pool, type RowDataPacket } from 'mysql2/promise';
import type { EnvConfig } from '../config/env';
import { createDatabaseConfig } from './config';

export type DatabasePool = Pool;
export type DatabaseRow = RowDataPacket;

export function createDatabasePool(env: EnvConfig): DatabasePool {
  const config = createDatabaseConfig(env);

  return mysql.createPool({
    ...config,
    decimalNumbers: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: 'Z',
  });
}
