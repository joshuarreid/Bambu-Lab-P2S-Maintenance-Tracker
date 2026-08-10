import type { RowDataPacket } from 'mysql2';
import type { DatabasePool } from '../database/mysql';
import type { MaintenanceJob, MaintenanceJobRow } from '../models/maintenance';

export interface MaintenanceJobsRepository {
  listActiveJobs(): Promise<MaintenanceJob[]>;
  findById(id: number): Promise<MaintenanceJob | null>;
}

type MaintenanceJobQueryRow = MaintenanceJobRow & RowDataPacket;

function mapMaintenanceJob(row: MaintenanceJobRow): MaintenanceJob {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    active: Boolean(row.active),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export function createMaintenanceJobsRepository(
  pool: DatabasePool,
): MaintenanceJobsRepository {
  return {
    async listActiveJobs() {
      const [rows] = await pool.query<MaintenanceJobQueryRow[]>(
        `
          SELECT id, name, description, active, created_at
          FROM maintenance_jobs
          WHERE active = 1
          ORDER BY name ASC
        `,
      );

      return rows.map(mapMaintenanceJob);
    },

    async findById(id) {
      const [rows] = await pool.query<MaintenanceJobQueryRow[]>(
        `
          SELECT id, name, description, active, created_at
          FROM maintenance_jobs
          WHERE id = ?
          LIMIT 1
        `,
        [id],
      );

      if (rows.length === 0) {
        return null;
      }

      return mapMaintenanceJob(rows[0]);
    },
  };
}
