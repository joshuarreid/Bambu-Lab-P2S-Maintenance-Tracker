import test from 'node:test';
import assert from 'node:assert/strict';
import { ValidationError } from '../../src/services/errors';
import { validateCreateMaintenanceRecordInput } from '../../src/validation/maintenance';

test('validateCreateMaintenanceRecordInput normalizes a valid maintenance payload', () => {
  const result = validateCreateMaintenanceRecordInput({
    printerHours: 12.5,
    maintenanceJobId: 3,
    category: 'ERROR',
    notes: 'Clog',
  });

  assert.deepEqual(result, {
    printerHours: 12.5,
    maintenanceJobId: 3,
    category: 'ERROR',
    notes: 'Clog',
  });
});

test('validateCreateMaintenanceRecordInput rejects negative printer hours', () => {
  assert.throws(
    () =>
      validateCreateMaintenanceRecordInput({
        printerHours: -0.1,
        maintenanceJobId: 3,
        category: 'ROUTINE',
      }),
    (error: unknown) => {
      assert.ok(error instanceof ValidationError);
      assert.equal(error.message, 'printerHours must be greater than or equal to 0');
      return true;
    },
  );
});

test('validateCreateMaintenanceRecordInput rejects invalid categories', () => {
  assert.throws(
    () =>
      validateCreateMaintenanceRecordInput({
        printerHours: 12.5,
        maintenanceJobId: 3,
        category: 'BROKEN',
      }),
    (error: unknown) => {
      assert.ok(error instanceof ValidationError);
      assert.equal(error.message, 'category must be one of: ROUTINE, ERROR');
      return true;
    },
  );
});
