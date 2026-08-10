import type { ResultSetHeader } from 'mysql2';
import type { RowDataPacket } from 'mysql2';
import type { DatabasePool } from '../database/mysql';
import type {
  CreateMaintenanceRecordInput,
  MaintenanceHistoryRecord,
  MaintenanceHistoryRow,
  MaintenanceJob,
  MaintenanceRecord,
  MaintenanceRecordRow,
} from '../models/maintenance';

export interface MaintenanceRecordsRepository {
  create(
    input: CreateMaintenanceRecordInput,
    job: MaintenanceJob,
    userId: number,
  ): Promise<MaintenanceRecord>;
  listHistory(userId: number): Promise<MaintenanceHistoryRecord[]>;
  update(
    id: number,
    input: CreateMaintenanceRecordInput,
    userId: number,
  ): Promise<MaintenanceRecord | null>;
  remove(id: number, userId: number): Promise<boolean>;
}

type MaintenanceHistoryQueryRow = MaintenanceHistoryRow & RowDataPacket;

function mapMaintenanceRecord(row: MaintenanceRecordRow): MaintenanceRecord {
  return {
    id: row.id,
    userId: row.user_id,
    printerHours: row.printer_hours,
    maintenanceJobId: row.maintenance_job_id,
    category: row.category,
    notes: row.notes,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function mapMaintenanceHistoryRecord(
  row: MaintenanceHistoryRow,
): MaintenanceHistoryRecord {
  return {
    ...mapMaintenanceRecord(row),
    maintenanceJobName: row.maintenance_job_name,
  };
}

export function createMaintenanceRecordsRepository(
  pool: DatabasePool,
): MaintenanceRecordsRepository {
  return {
    async create(input, job, userId) {
      const [result] = await pool.execute<ResultSetHeader>(
        `
          INSERT INTO maintenance_records (
            user_id,
            printer_hours,
            maintenance_job_id,
            category,
            notes
          )
          VALUES (?, ?, ?, ?, ?)
        `,
        [
          userId,
          input.printerHours,
          input.maintenanceJobId,
          input.category,
          input.notes,
        ],
      );

      return {
        id: result.insertId,
        userId,
        printerHours: input.printerHours,
        maintenanceJobId: input.maintenanceJobId,
        category: input.category,
        notes: input.notes,
        createdAt: new Date().toISOString(),
      };
    },

    async listHistory(userId) {
      const [rows] = await pool.query<MaintenanceHistoryQueryRow[]>(
        `
          SELECT
            mr.id,
            mr.user_id,
            mr.printer_hours,
            mr.maintenance_job_id,
            mr.category,
            mr.notes,
            mr.created_at,
            mj.name AS maintenance_job_name
          FROM maintenance_records mr
          INNER JOIN maintenance_jobs mj
            ON mj.id = mr.maintenance_job_id
          WHERE mr.user_id = ?
          ORDER BY mr.created_at DESC, mr.id DESC
        `,
        [userId],
      );

      return rows.map(mapMaintenanceHistoryRecord);
    },

    async update(id, input, userId) {
      const [result] = await pool.execute<ResultSetHeader>(
        `
          UPDATE maintenance_records
          SET printer_hours = ?,
              maintenance_job_id = ?,
              category = ?,
              notes = ?
          WHERE id = ? AND user_id = ?
        `,
        [input.printerHours, input.maintenanceJobId, input.category, input.notes, id, userId],
      );

      if (result.affectedRows === 0) {
        return null;
      }

      const [rows] = await pool.query<(MaintenanceRecordRow & RowDataPacket)[]>(
        `SELECT * FROM maintenance_records WHERE id = ?`,
        [id],
      );

      return rows.length > 0 ? mapMaintenanceRecord(rows[0]) : null;
    },

    async remove(id, userId) {
      const [result] = await pool.execute<ResultSetHeader>(
        `DELETE FROM maintenance_records WHERE id = ? AND user_id = ?`,
        [id, userId],
      );

      return result.affectedRows > 0;
    },
  };
}
