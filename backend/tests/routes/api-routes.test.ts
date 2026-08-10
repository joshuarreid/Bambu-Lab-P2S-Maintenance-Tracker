import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../../src/app';
import type {
  CreateMaintenanceRecordInput,
  MaintenanceHistoryRecord,
  MaintenanceJob,
  MaintenanceRecord,
} from '../../src/models/maintenance';
import { createMaintenanceService } from '../../src/services/maintenance-service';
import type { MaintenanceService } from '../../src/services/maintenance-service';
import type { AuthService } from '../../src/services/auth-service';

class InMemoryMaintenanceJobsRepository {
  constructor(private readonly jobs: MaintenanceJob[]) {}

  async listActiveJobs(): Promise<MaintenanceJob[]> {
    return this.jobs.filter((job) => job.active);
  }

  async findById(id: number): Promise<MaintenanceJob | null> {
    return this.jobs.find((job) => job.id === id) ?? null;
  }
}

class InMemoryMaintenanceRecordsRepository {
  private nextId = 1;

  constructor(private readonly records: MaintenanceHistoryRecord[] = []) {
    if (records.length > 0) {
      this.nextId = Math.max(...records.map((record) => record.id)) + 1;
    }
  }

  async create(
    input: CreateMaintenanceRecordInput,
    job: MaintenanceJob,
  ): Promise<MaintenanceRecord> {
    const record: MaintenanceRecord = {
      id: this.nextId++,
      userId: 1,
      printerHours: input.printerHours,
      maintenanceJobId: input.maintenanceJobId,
      category: input.category,
      notes: input.notes,
      createdAt: new Date().toISOString(),
    };

    this.records.unshift({
      ...record,
      maintenanceJobName: job.name,
    });

    return record;
  }

  async listHistory(): Promise<MaintenanceHistoryRecord[]> {
    return this.records;
  }
}

function createTestApp(records: MaintenanceHistoryRecord[] = []) {
  const jobs: MaintenanceJob[] = [
    {
      id: 1,
      name: 'Clean build plate',
      description: 'Routine cleaning',
      active: true,
      createdAt: '2026-08-09T00:00:00.000Z',
    },
    {
      id: 2,
      name: 'Clean XY rods',
      description: 'Rod maintenance',
      active: true,
      createdAt: '2026-08-09T00:00:00.000Z',
    },
  ];

  const service = createMaintenanceService({
    maintenanceJobsRepository: new InMemoryMaintenanceJobsRepository(jobs),
    maintenanceRecordsRepository: new InMemoryMaintenanceRecordsRepository(records),
  });

  const authService: AuthService = {
    async getSessionUser() {
      return {
        id: 1,
        email: 'jacky@example.com',
        displayName: 'Jacky',
        avatarUrl: null,
      };
    },
    createLoginRedirect: () => ({ redirectUrl: '/', cookies: [] }),
    async handleGoogleCallback() {
      throw new Error('not implemented');
    },
    async createLogoutCookies() {
      return [];
    },
  };

  return createApp({ authService, maintenanceService: service });
}

function createErroringApp() {
  const service: MaintenanceService = {
    listMaintenanceJobs: async () => {
      throw new Error('database offline');
    },
    listMaintenanceHistory: async () => [],
    createMaintenanceRecord: async () => {
      throw new Error('database offline');
    },
  };

  const authService: AuthService = {
    async getSessionUser() {
      return {
        id: 1,
        email: 'jacky@example.com',
        displayName: 'Jacky',
        avatarUrl: null,
      };
    },
    createLoginRedirect: () => ({ redirectUrl: '/', cookies: [] }),
    async handleGoogleCallback() {
      throw new Error('not implemented');
    },
    async createLogoutCookies() {
      return [];
    },
  };

  return createApp({ authService, maintenanceService: service });
}

test('GET /health returns ok without database access', async () => {
  const app = createTestApp();

  const response = await app.inject({
    method: 'GET',
    url: '/health',
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { status: 'ok' });
});

test('GET /api/auth/session reports an unauthenticated session by default', async () => {
  const authService: AuthService = {
    async getSessionUser() {
      return null;
    },
    createLoginRedirect: () => ({ redirectUrl: '/', cookies: [] }),
    async handleGoogleCallback() {
      throw new Error('not implemented');
    },
    async createLogoutCookies() {
      return [];
    },
  };
  const app = createApp({
    authService,
    maintenanceService: {
      listMaintenanceJobs: async () => [],
      listMaintenanceHistory: async () => [],
      createMaintenanceRecord: async () => {
        throw new Error('not implemented');
      },
    },
  });

  const response = await app.inject({
    method: 'GET',
    url: '/api/auth/session',
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    authenticated: false,
    user: null,
  });
});

test('GET / returns ok without database access', async () => {
  const app = createTestApp();

  const response = await app.inject({
    method: 'GET',
    url: '/',
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { status: 'ok' });
});

test('GET /api/maintenance/jobs returns active maintenance jobs', async () => {
  const app = createTestApp();

  const response = await app.inject({
    method: 'GET',
    url: '/api/maintenance/jobs',
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    jobs: [
      {
        id: 1,
        name: 'Clean build plate',
        description: 'Routine cleaning',
        active: true,
        createdAt: '2026-08-09T00:00:00.000Z',
      },
      {
        id: 2,
        name: 'Clean XY rods',
        description: 'Rod maintenance',
        active: true,
        createdAt: '2026-08-09T00:00:00.000Z',
      },
    ],
  });
});

test('GET /api/maintenance/jobs returns 401 without a session', async () => {
  const authService: AuthService = {
    async getSessionUser() {
      return null;
    },
    createLoginRedirect: () => ({ redirectUrl: '/', cookies: [] }),
    async handleGoogleCallback() {
      throw new Error('not implemented');
    },
    async createLogoutCookies() {
      return [];
    },
  };
  const app = createApp({
    authService,
    maintenanceService: {
      listMaintenanceJobs: async () => [],
      listMaintenanceHistory: async () => [],
      createMaintenanceRecord: async () => {
        throw new Error('not implemented');
      },
    },
  });

  const response = await app.inject({
    method: 'GET',
    url: '/api/maintenance/jobs',
  });

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.json(), {
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    },
  });
});

test('POST /api/maintenance returns 400 for invalid payloads', async () => {
  const app = createTestApp();

  const response = await app.inject({
    method: 'POST',
    url: '/api/maintenance',
    payload: {
      printerHours: -1,
      maintenanceJobId: 1,
      category: 'ROUTINE',
    },
  });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.json(), {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'printerHours must be greater than or equal to 0',
    },
  });
});

test('POST /api/maintenance returns 404 when the maintenance job does not exist', async () => {
  const app = createTestApp();

  const response = await app.inject({
    method: 'POST',
    url: '/api/maintenance',
    payload: {
      printerHours: 120.5,
      maintenanceJobId: 999,
      category: 'ROUTINE',
      notes: null,
    },
  });

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.json(), {
    error: {
      code: 'MAINTENANCE_JOB_NOT_FOUND',
      message: 'Maintenance job 999 was not found',
    },
  });
});

test('POST /api/maintenance creates a maintenance record', async () => {
  const app = createTestApp();

  const response = await app.inject({
    method: 'POST',
    url: '/api/maintenance',
    payload: {
      printerHours: 120.5,
      maintenanceJobId: 2,
      category: 'ERROR',
      notes: 'Unusual noise',
    },
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.json().record.userId, 1);
  assert.equal(response.json().record.printerHours, 120.5);
  assert.equal(response.json().record.maintenanceJobId, 2);
  assert.equal(response.json().record.category, 'ERROR');
  assert.equal(response.json().record.notes, 'Unusual noise');
  assert.equal(typeof response.json().record.id, 'number');
});

test('GET /api/maintenance returns records newest first', async () => {
  const app = createTestApp([
    {
      id: 2,
      userId: 1,
      printerHours: 120.5,
      maintenanceJobId: 2,
      maintenanceJobName: 'Clean XY rods',
      category: 'ERROR',
      notes: 'Noise',
      createdAt: '2026-08-09T18:42:00.000Z',
    },
    {
      id: 1,
      userId: 1,
      printerHours: 100,
      maintenanceJobId: 1,
      maintenanceJobName: 'Clean build plate',
      category: 'ROUTINE',
      notes: null,
      createdAt: '2026-08-08T18:42:00.000Z',
    },
  ]);

  const response = await app.inject({
    method: 'GET',
    url: '/api/maintenance',
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    records: [
      {
        id: 2,
        userId: 1,
        printerHours: 120.5,
        maintenanceJobId: 2,
        maintenanceJobName: 'Clean XY rods',
        category: 'ERROR',
        notes: 'Noise',
        createdAt: '2026-08-09T18:42:00.000Z',
      },
      {
        id: 1,
        userId: 1,
        printerHours: 100,
        maintenanceJobId: 1,
        maintenanceJobName: 'Clean build plate',
        category: 'ROUTINE',
        notes: null,
        createdAt: '2026-08-08T18:42:00.000Z',
      },
    ],
  });
});

test('unexpected route failures return a consistent json error response', async () => {
  const app = createErroringApp();

  const response = await app.inject({
    method: 'GET',
    url: '/api/maintenance/jobs',
  });

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.json(), {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});
