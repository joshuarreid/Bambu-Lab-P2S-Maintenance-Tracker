export const MAINTENANCE_CATEGORIES = ['ROUTINE', 'ERROR'] as const;

export type MaintenanceCategory = (typeof MAINTENANCE_CATEGORIES)[number];

export interface CreateMaintenanceRecordInput {
  printerHours: number;
  maintenanceJobId: number;
  category: MaintenanceCategory;
  notes: string | null;
}

export interface AuthenticatedMaintenanceContext {
  userId: number;
}

export interface MaintenanceJob {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: number;
  userId: number;
  printerHours: number;
  maintenanceJobId: number;
  category: MaintenanceCategory;
  notes: string | null;
  createdAt: string;
}

export interface MaintenanceHistoryRecord extends MaintenanceRecord {
  maintenanceJobName: string;
}

export interface MaintenanceJobRow {
  id: number;
  name: string;
  description: string | null;
  active: number | boolean;
  created_at: Date | string;
}

export interface MaintenanceRecordRow {
  id: number;
  user_id: number;
  printer_hours: number;
  maintenance_job_id: number;
  category: MaintenanceCategory;
  notes: string | null;
  created_at: Date | string;
}

export interface MaintenanceHistoryRow extends MaintenanceRecordRow {
  maintenance_job_name: string;
}
