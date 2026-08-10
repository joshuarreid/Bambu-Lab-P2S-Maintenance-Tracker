import type {
  CreateMaintenanceRecordInput,
  MaintenanceHistoryRecord,
  MaintenanceJob,
  MaintenanceRecord,
} from '../models/maintenance';
import type { MaintenanceJobsRepository } from '../repositories/maintenance-jobs-repository';
import type { MaintenanceRecordsRepository } from '../repositories/maintenance-records-repository';
import { NotFoundError } from './errors';
import { validateCreateMaintenanceRecordInput } from '../validation/maintenance';

export interface MaintenanceService {
  listMaintenanceJobs(): Promise<MaintenanceJob[]>;
  listMaintenanceHistory(userId: number): Promise<MaintenanceHistoryRecord[]>;
  createMaintenanceRecord(input: unknown, userId: number): Promise<MaintenanceRecord>;
  updateMaintenanceRecord(id: number, input: unknown, userId: number): Promise<MaintenanceRecord>;
  deleteMaintenanceRecord(id: number, userId: number): Promise<void>;
}

export interface MaintenanceServiceDependencies {
  maintenanceJobsRepository: MaintenanceJobsRepository;
  maintenanceRecordsRepository: MaintenanceRecordsRepository;
}

export function createMaintenanceService(
  dependencies: MaintenanceServiceDependencies,
): MaintenanceService {
  return {
    async listMaintenanceJobs() {
      return dependencies.maintenanceJobsRepository.listActiveJobs();
    },

    async listMaintenanceHistory(userId: number) {
      return dependencies.maintenanceRecordsRepository.listHistory(userId);
    },

    async createMaintenanceRecord(input: unknown, userId: number) {
      const validatedInput: CreateMaintenanceRecordInput =
        validateCreateMaintenanceRecordInput(input);
      const job = await dependencies.maintenanceJobsRepository.findById(
        validatedInput.maintenanceJobId,
      );

      if (!job) {
        throw new NotFoundError(
          `Maintenance job ${validatedInput.maintenanceJobId} was not found`,
          'MAINTENANCE_JOB_NOT_FOUND',
        );
      }

      return dependencies.maintenanceRecordsRepository.create(
        validatedInput,
        job,
        userId,
      );
    },

    async updateMaintenanceRecord(id: number, input: unknown, userId: number) {
      const validatedInput: CreateMaintenanceRecordInput =
        validateCreateMaintenanceRecordInput(input);
      const job = await dependencies.maintenanceJobsRepository.findById(
        validatedInput.maintenanceJobId,
      );

      if (!job) {
        throw new NotFoundError(
          `Maintenance job ${validatedInput.maintenanceJobId} was not found`,
          'MAINTENANCE_JOB_NOT_FOUND',
        );
      }

      const updated = await dependencies.maintenanceRecordsRepository.update(
        id,
        validatedInput,
        userId,
      );

      if (!updated) {
        throw new NotFoundError(
          `Maintenance record ${id} was not found`,
          'MAINTENANCE_RECORD_NOT_FOUND',
        );
      }

      return updated;
    },

    async deleteMaintenanceRecord(id: number, userId: number) {
      const deleted = await dependencies.maintenanceRecordsRepository.remove(id, userId);

      if (!deleted) {
        throw new NotFoundError(
          `Maintenance record ${id} was not found`,
          'MAINTENANCE_RECORD_NOT_FOUND',
        );
      }
    },
  };
}
