import path from 'node:path';
import fastifyStatic from '@fastify/static';
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

  // Serve the compiled frontend in production.
  // The frontend dist is built to frontend/dist relative to the repo root,
  // which sits two directories up from backend/dist/server.js at runtime.
  if (process.env.NODE_ENV === 'production') {
    const frontendDist = path.resolve(__dirname, '../../frontend/dist');

    app.register(fastifyStatic, {
      root: frontendDist,
      prefix: '/',
      decorateReply: false,
    });

    // Fall back to index.html for non-API routes (client-side routing).
    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api') || request.url.startsWith('/health')) {
        reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
        return;
      }
      reply.sendFile('index.html', frontendDist);
    });
  }

  return app;
}
