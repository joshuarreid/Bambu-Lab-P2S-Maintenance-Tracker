import type { FastifyInstance } from 'fastify';
import type { AppDependencies } from '../app';
import { registerAuthRoutes } from './auth-routes';
import { getErrorResponse } from '../services/errors';
import { registerHealthRoute } from './health-route';
import { registerMaintenanceRoutes } from './maintenance-routes';

export function registerRoutes(app: FastifyInstance, dependencies: AppDependencies) {
  app.setErrorHandler((error, _request, reply) => {
    const { statusCode, body } = getErrorResponse(error);

    reply.status(statusCode).send(body);
  });

  registerHealthRoute(app);
  registerAuthRoutes(app, dependencies.authService);
  registerMaintenanceRoutes(app, dependencies.maintenanceService);
}
