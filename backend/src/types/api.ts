import type {
  MaintenanceHistoryRecord,
  MaintenanceJob,
  MaintenanceRecord,
} from '../models/maintenance';

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export interface MaintenanceJobsResponse {
  jobs: MaintenanceJob[];
}

export interface MaintenanceHistoryResponse {
  records: MaintenanceHistoryRecord[];
}

export interface MaintenanceRecordResponse {
  record: MaintenanceRecord;
}

export interface AuthSessionUser {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface AuthSessionResponse {
  authenticated: boolean;
  user: AuthSessionUser | null;
}
