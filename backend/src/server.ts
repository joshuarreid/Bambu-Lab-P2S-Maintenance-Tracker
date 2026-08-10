import { createApp } from './app';
import { loadEnv } from './config/env';
import { createDatabasePool } from './database/mysql';
import { createAuthService } from './services/auth-service';
import { createMaintenanceJobsRepository } from './repositories/maintenance-jobs-repository';
import { createMaintenanceRecordsRepository } from './repositories/maintenance-records-repository';
import { createMaintenanceService } from './services/maintenance-service';

async function startServer() {
  const env = loadEnv();
  const pool = createDatabasePool(env);
  const authService = createAuthService(pool, env);
  const maintenanceService = createMaintenanceService({
    maintenanceJobsRepository: createMaintenanceJobsRepository(pool),
    maintenanceRecordsRepository: createMaintenanceRecordsRepository(pool),
  });
  const app = createApp({ authService, maintenanceService });

  try {
    await app.listen({
      host: '0.0.0.0',
      port: env.port,
    });
  } catch (error) {
    app.log.error(error);
    await pool.end();
    process.exit(1);
  }
}

void startServer();
