import assert from 'node:assert/strict';
import test from 'node:test';
import { createMaintenanceService } from '../../src/services/maintenance-service';
import type {
  CreateMaintenanceRecordInput,
  MaintenanceHistoryRecord,
  MaintenanceJob,
  MaintenanceRecord,
} from '../../src/models/maintenance';

class RecordingJobsRepository {
  constructor(private readonly jobs: MaintenanceJob[]) {}

  async listActiveJobs(): Promise<MaintenanceJob[]> {
    return this.jobs.filter((job) => job.active);
  }

  async findById(id: number): Promise<MaintenanceJob | null> {
    return this.jobs.find((job) => job.id === id) ?? null;
  }
}

class RecordingRecordsRepository {
  public lastCreateUserId: number | undefined;
  public lastListUserId: number | undefined;

  async create(
    input: CreateMaintenanceRecordInput,
    job: MaintenanceJob,
    userId = 1,
  ): Promise<MaintenanceRecord> {
    this.lastCreateUserId = userId;

    return {
      id: 1,
      userId,
      printerHours: input.printerHours,
      maintenanceJobId: job.id,
      category: input.category,
      notes: input.notes,
      createdAt: '2026-08-09T18:42:00.000Z',
    };
  }

  async listHistory(userId = 1): Promise<MaintenanceHistoryRecord[]> {
    this.lastListUserId = userId;

    return [];
  }
}

test('maintenance service passes user context through to repository calls', async () => {
  const jobs = [
    {
      id: 1,
      name: 'Clean XY rods',
      description: null,
      active: true,
      createdAt: '2026-08-09T00:00:00.000Z',
    },
  ];
  const recordsRepository = new RecordingRecordsRepository();
  const service = createMaintenanceService({
    maintenanceJobsRepository: new RecordingJobsRepository(jobs),
    maintenanceRecordsRepository: recordsRepository,
  });

  await service.listMaintenanceHistory(42);
  const record = await service.createMaintenanceRecord(
    {
      printerHours: 120.5,
      maintenanceJobId: 1,
      category: 'ROUTINE',
      notes: null,
    },
    42,
  );

  assert.equal(recordsRepository.lastListUserId, 42);
  assert.equal(recordsRepository.lastCreateUserId, 42);
  assert.equal(record.userId, 42);
});
