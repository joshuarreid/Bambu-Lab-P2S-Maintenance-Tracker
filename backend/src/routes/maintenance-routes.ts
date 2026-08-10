import type { FastifyInstance } from 'fastify';
import type { MaintenanceService } from '../services/maintenance-service';
import { UnauthorizedError } from '../services/errors';

function requireAuthenticatedUserId(request: { user?: { id: number } }) {
  if (!request.user) {
    throw new UnauthorizedError();
  }

  return request.user.id;
}

export function registerMaintenanceRoutes(
  app: FastifyInstance,
  maintenanceService: MaintenanceService,
) {
  app.get('/api/maintenance/jobs', async (request, reply) => {
    requireAuthenticatedUserId(request);
    const jobs = await maintenanceService.listMaintenanceJobs();

    reply.status(200).send({ jobs });
  });

  app.get('/api/maintenance', async (request, reply) => {
    const userId = requireAuthenticatedUserId(request);
    const records = await maintenanceService.listMaintenanceHistory(userId);

    reply.status(200).send({ records });
  });

  app.post('/api/maintenance', async (request, reply) => {
    const userId = requireAuthenticatedUserId(request);
    const record = await maintenanceService.createMaintenanceRecord(
      request.body,
      userId,
    );

    reply.status(201).send({ record });
  });

  app.put('/api/maintenance/:id', async (request, reply) => {
    const userId = requireAuthenticatedUserId(request);
    const id = Number((request.params as { id: string }).id);
    const record = await maintenanceService.updateMaintenanceRecord(id, request.body, userId);

    reply.status(200).send({ record });
  });

  app.delete('/api/maintenance/:id', async (request, reply) => {
    const userId = requireAuthenticatedUserId(request);
    const id = Number((request.params as { id: string }).id);
    await maintenanceService.deleteMaintenanceRecord(id, userId);

    reply.status(204).send();
  });
}
