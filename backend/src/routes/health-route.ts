import type { FastifyInstance } from 'fastify';

export function registerHealthRoute(app: FastifyInstance) {
  app.get('/', async () => ({
    status: 'ok',
  }));

  app.get('/health', async () => ({
    status: 'ok',
  }));
}
