import Fastify from 'fastify';
import type { AuthService } from './services/auth-service';
import type { MaintenanceService } from './services/maintenance-service';
import { registerRoutes } from './routes';

export interface AppDependencies {
  authService: AuthService;
  maintenanceService: MaintenanceService;
}

export function createApp(dependencies: AppDependencies) {
  const app = Fastify({
    logger: true,
  });

  app.addHook('onRequest', async (request) => {
    request.user = (await dependencies.authService.getSessionUser(request.headers.cookie)) ?? undefined;
  });

  registerRoutes(app, dependencies);

  return app;
}
