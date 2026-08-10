export interface MaintenanceJob {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: number;
  printerHours: number;
  maintenanceJobId: number;
  category: 'ROUTINE' | 'ERROR';
  notes: string | null;
  createdAt: string;
}

export interface MaintenanceHistoryRecord extends MaintenanceRecord {
  maintenanceJobName: string;
}

export interface CreateMaintenanceRecordInput {
  printerHours: number;
  maintenanceJobId: number;
  category: 'ROUTINE' | 'ERROR';
  notes: string | null;
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

interface ApiErrorPayload {
  error?: {
    code: string;
    message: string;
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string = 'API_ERROR',
  ) {
    super(message);
  }
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    credentials: 'include',
    ...init,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    throw new ApiError(
      payload?.error?.message ?? `Request failed with status ${response.status}`,
      response.status,
      payload?.error?.code,
    );
  }

  return (await response.json()) as T;
}

export async function getMaintenanceJobs() {
  return apiRequest<{ jobs: MaintenanceJob[] }>('/api/maintenance/jobs');
}

export async function getMaintenanceHistory() {
  return apiRequest<{ records: MaintenanceHistoryRecord[] }>('/api/maintenance');
}

export async function createMaintenanceRecord(input: CreateMaintenanceRecordInput) {
  return apiRequest<{ record: MaintenanceRecord }>('/api/maintenance', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateMaintenanceRecord(id: number, input: CreateMaintenanceRecordInput) {
  return apiRequest<{ record: MaintenanceRecord }>(`/api/maintenance/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteMaintenanceRecord(id: number) {
  await fetch(`/api/maintenance/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
}

export async function getAuthSession() {
  return apiRequest<AuthSessionResponse>('/api/auth/session');
}
