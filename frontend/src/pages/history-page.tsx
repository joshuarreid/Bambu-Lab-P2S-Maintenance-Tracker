import { useState } from 'react';
import type { MaintenanceHistoryRecord } from '../api/client';
import { useDeleteMaintenanceRecord } from '../hooks/use-delete-maintenance-record';
import { useMaintenanceHistory } from '../hooks/use-maintenance-history';
import { useMaintenanceJobs } from '../hooks/use-maintenance-jobs';
import { useUpdateMaintenanceRecord } from '../hooks/use-update-maintenance-record';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatHours(h: number) {
  return `${h % 1 === 0 ? h.toFixed(0) : h.toFixed(1)} h`;
}

interface EditSheetProps {
  record: MaintenanceHistoryRecord;
  jobOptions: { id: number; name: string }[];
  onClose: () => void;
}

function EditSheet({ record, jobOptions, onClose }: EditSheetProps) {
  const updateMutation = useUpdateMaintenanceRecord();
  const deleteMutation = useDeleteMaintenanceRecord();

  const [printerHours, setPrinterHours] = useState(record.printerHours);
  const [jobId, setJobId] = useState(String(record.maintenanceJobId));
  const [category, setCategory] = useState<'ROUTINE' | 'ERROR'>(record.category);
  const [notes, setNotes] = useState(record.notes ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isPending = updateMutation.isPending || deleteMutation.isPending;

  async function handleSave() {
    await updateMutation.mutateAsync({
      id: record.id,
      input: {
        printerHours,
        maintenanceJobId: Number(jobId),
        category,
        notes: notes.trim() || null,
      },
    });
    onClose();
  }

  async function handleDelete() {
    await deleteMutation.mutateAsync(record.id);
    onClose();
  }

  return (
    <div className="edit-sheet__backdrop" onClick={onClose}>
      <div
        className="edit-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Edit maintenance record"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="edit-sheet__handle" aria-hidden="true" />

        <div className="edit-sheet__header">
          <h2 className="edit-sheet__title">Edit record</h2>
          <button className="edit-sheet__close" type="button" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="edit-sheet__body">
          <div className="edit-sheet__field">
            <label className="edit-sheet__label" htmlFor="edit-hours">Printer hours</label>
            <input
              className="edit-sheet__input"
              id="edit-hours"
              type="number"
              inputMode="numeric"
              min={0}
              max={9999}
              step={0.1}
              value={printerHours}
              onChange={(e) => setPrinterHours(Number(e.target.value))}
            />
          </div>

          <div className="edit-sheet__field">
            <label className="edit-sheet__label" htmlFor="edit-job">Job</label>
            <select
              className="edit-sheet__input"
              id="edit-job"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
            >
              {jobOptions.map((j) => (
                <option key={j.id} value={j.id}>{j.name}</option>
              ))}
            </select>
          </div>

          <fieldset className="edit-sheet__field">
            <legend className="edit-sheet__label">Category</legend>
            <div className="edit-sheet__choices">
              <label className="edit-sheet__choice">
                <input type="radio" name="edit-cat" value="ROUTINE" checked={category === 'ROUTINE'} onChange={() => setCategory('ROUTINE')} />
                Routine
              </label>
              <label className="edit-sheet__choice">
                <input type="radio" name="edit-cat" value="ERROR" checked={category === 'ERROR'} onChange={() => setCategory('ERROR')} />
                Error
              </label>
            </div>
          </fieldset>

          <div className="edit-sheet__field">
            <label className="edit-sheet__label" htmlFor="edit-notes">Notes</label>
            <textarea
              className="edit-sheet__input edit-sheet__input--textarea"
              id="edit-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="edit-sheet__actions">
          {confirmDelete ? (
            <>
              <p className="edit-sheet__confirm-text">Delete this record permanently?</p>
              <button
                className="edit-sheet__btn edit-sheet__btn--danger"
                type="button"
                disabled={isPending}
                onClick={handleDelete}
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                className="edit-sheet__btn edit-sheet__btn--ghost"
                type="button"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                className="edit-sheet__btn edit-sheet__btn--primary"
                type="button"
                disabled={isPending}
                onClick={handleSave}
              >
                {updateMutation.isPending ? 'Saving…' : 'Save changes'}
              </button>
              <button
                className="edit-sheet__btn edit-sheet__btn--ghost-danger"
                type="button"
                disabled={isPending}
                onClick={() => setConfirmDelete(true)}
              >
                Delete record
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function HistoryPage() {
  const historyQuery = useMaintenanceHistory();
  const jobsQuery = useMaintenanceJobs();
  const [editing, setEditing] = useState<MaintenanceHistoryRecord | null>(null);

  const records = historyQuery.data ?? [];
  const jobOptions = (jobsQuery.data ?? []).map((j) => ({ id: j.id, name: j.name }));

  return (
    <section className="page page--history" aria-label="Maintenance history">
      <div className="history-table-wrap">
        <div className="history-table-header">
          <h1 className="history-table-title">History</h1>
          {records.length > 0 && (
            <span className="history-table-count">{records.length} records</span>
          )}
        </div>

        {historyQuery.isLoading ? (
          <p className="history-table__status">Loading history…</p>
        ) : historyQuery.isError ? (
          <p className="history-table__status history-table__status--error" role="alert">
            Unable to load history right now.
          </p>
        ) : records.length === 0 ? (
          <p className="history-table__status">No maintenance records yet.</p>
        ) : (
          <div className="history-table-scroll">
            <table className="history-table" aria-label="Maintenance history">
              <thead className="history-table__head">
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Job</th>
                  <th scope="col">Hours</th>
                  <th scope="col">Cat.</th>
                  <th scope="col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr
                    key={record.id}
                    className="history-table__row"
                    onClick={() => setEditing(record)}
                  >
                    <td className="history-table__cell history-table__cell--date">
                      {formatDate(record.createdAt)}
                    </td>
                    <td className="history-table__cell history-table__cell--job">
                      {record.maintenanceJobName}
                      {record.notes ? (
                        <span className="history-table__notes">{record.notes}</span>
                      ) : null}
                    </td>
                    <td className="history-table__cell history-table__cell--hours">
                      {formatHours(record.printerHours)}
                    </td>
                    <td className="history-table__cell history-table__cell--cat">
                      <span className={`history-table__badge history-table__badge--${record.category.toLowerCase()}`}>
                        {record.category === 'ROUTINE' ? 'R' : 'E'}
                      </span>
                    </td>
                    <td className="history-table__cell history-table__cell--action">
                      <button
                        className="history-table__edit-btn"
                        type="button"
                        aria-label={`Edit ${record.maintenanceJobName} record`}
                        onClick={() => setEditing(record)}
                      >
                        ···
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing ? (
        <EditSheet
          record={editing}
          jobOptions={jobOptions}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </section>
  );
}
