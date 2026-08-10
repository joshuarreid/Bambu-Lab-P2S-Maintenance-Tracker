import {
  MAINTENANCE_CATEGORIES,
  type CreateMaintenanceRecordInput,
  type MaintenanceCategory,
} from '../models/maintenance';
import { ValidationError } from '../services/errors';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parsePrinterHours(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    throw new ValidationError('printerHours must be a valid number');
  }

  if (value < 0) {
    throw new ValidationError('printerHours must be greater than or equal to 0');
  }

  return value;
}

function parseMaintenanceJobId(value: unknown): number {
  if (!Number.isInteger(value) || (value as number) <= 0) {
    throw new ValidationError('maintenanceJobId must be a positive integer');
  }

  return value as number;
}

function parseCategory(value: unknown): MaintenanceCategory {
  if (
    typeof value !== 'string' ||
    !MAINTENANCE_CATEGORIES.includes(value as MaintenanceCategory)
  ) {
    throw new ValidationError(
      `category must be one of: ${MAINTENANCE_CATEGORIES.join(', ')}`,
    );
  }

  return value as MaintenanceCategory;
}

function parseNotes(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new ValidationError('notes must be a string when provided');
  }

  const trimmedNotes = value.trim();

  return trimmedNotes.length > 0 ? trimmedNotes : null;
}

export function validateCreateMaintenanceRecordInput(
  input: unknown,
): CreateMaintenanceRecordInput {
  if (!isObject(input)) {
    throw new ValidationError('Request body must be an object');
  }

  return {
    printerHours: parsePrinterHours(input.printerHours),
    maintenanceJobId: parseMaintenanceJobId(input.maintenanceJobId),
    category: parseCategory(input.category),
    notes: parseNotes(input.notes),
  };
}
