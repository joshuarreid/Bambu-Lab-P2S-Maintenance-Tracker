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
  // Path is resolved relative to this file's location:
  // backend/dist/server.js → ../../frontend/dist = frontend/dist at repo root.
  // Also try the sibling pattern used by DO App Platform (/workspace layout).
  if (process.env.NODE_ENV === 'production') {
    const candidates = [
      path.resolve(__dirname, '../../frontend/dist'),   // local / Docker
      path.resolve(__dirname, '../../../frontend/dist'), // alternate nesting
      path.resolve(process.cwd(), 'frontend/dist'),      // cwd-relative fallback
    ];

    const fs = await import('node:fs');
    const frontendDist = candidates.find((p) => fs.existsSync(p)) ?? candidates[0];

    app.log.info(`Serving frontend from: ${frontendDist}`);

    app.register(fastifyStatic, {
      root: frontendDist,
      prefix: '/',
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
