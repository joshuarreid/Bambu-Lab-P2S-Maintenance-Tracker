import { useState } from 'react';
import type { MaintenanceJob } from '../api/client';
import { useCreateMaintenanceRecord } from '../hooks/use-create-maintenance-record';
import { getDefaultCategoryForJob, type MaintenanceCategory } from '../lib/maintenance-job-metadata';

interface QuickLogSheetProps {
  job: MaintenanceJob;
  latestPrinterHours: number | null;
  onClose: () => void;
}

export function QuickLogSheet({ job, latestPrinterHours, onClose }: QuickLogSheetProps) {
  const createMutation = useCreateMaintenanceRecord();
  const [hoursInput, setHoursInput] = useState(String(latestPrinterHours ?? 0));
  const [hoursError, setHoursError] = useState('');
  const [isHistorical, setIsHistorical] = useState(false);
  const [category, setCategory] = useState<MaintenanceCategory>(
    getDefaultCategoryForJob(job.name) ?? 'ROUTINE',
  );
  const [notes, setNotes] = useState('');

  const minHours = isHistorical ? 0 : (latestPrinterHours ?? 0);

  async function handleSubmit() {
    const parsedHours = parseFloat(hoursInput);
    if (Number.isNaN(parsedHours) || parsedHours < minHours) {
      setHoursError(
        isHistorical
          ? 'Enter a valid number of hours (0 or more).'
          : `Hours must be at least ${minHours} (current total).`,
      );
      return;
    }
    setHoursError('');
    await createMutation.mutateAsync({
      printerHours: parsedHours,
      maintenanceJobId: job.id,
      category,
      notes: notes.trim() || null,
    });
    onClose();
  }

  return (
    <div className="edit-sheet__backdrop" onClick={onClose}>
      <div
        className="edit-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Log ${job.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="edit-sheet__handle" aria-hidden="true" />

        <div className="edit-sheet__header">
          <h2 className="edit-sheet__title">{job.name}</h2>
          <button className="edit-sheet__close" type="button" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="edit-sheet__body">
          <div className="edit-sheet__field">
            <label className="edit-sheet__label" htmlFor="quick-log-hours">
              Printer hours
            </label>
            <input
              className="edit-sheet__input"
              id="quick-log-hours"
              type="number"
              inputMode="decimal"
              min={0}
              step={0.1}
              value={hoursInput}
              onChange={(e) => { setHoursInput(e.target.value); setHoursError(''); }}
            />
            {hoursError ? (
              <p className="maintenance-form__error" role="alert">{hoursError}</p>
            ) : null}
            <label className="maintenance-form__historical-toggle">
              Historical entry — logging a past record
              <input
                type="checkbox"
                checked={isHistorical}
                onChange={(e) => {
                  setIsHistorical(e.target.checked);
                  setHoursError('');
                  if (!e.target.checked) {
                    setHoursInput(String(latestPrinterHours ?? 0));
                  }
                }}
              />
            </label>
          </div>

          <fieldset className="edit-sheet__field">
            <legend className="edit-sheet__label">Category</legend>
            <div className="edit-sheet__choices">
              <label className="edit-sheet__choice">
                <input
                  type="radio"
                  name="quick-log-cat"
                  value="ROUTINE"
                  checked={category === 'ROUTINE'}
                  onChange={() => setCategory('ROUTINE')}
                />
                Routine
              </label>
              <label className="edit-sheet__choice">
                <input
                  type="radio"
                  name="quick-log-cat"
                  value="ERROR"
                  checked={category === 'ERROR'}
                  onChange={() => setCategory('ERROR')}
                />
                Error
              </label>
            </div>
          </fieldset>

          <div className="edit-sheet__field">
            <label className="edit-sheet__label" htmlFor="quick-log-notes">
              Notes
            </label>
            <textarea
              className="edit-sheet__input edit-sheet__input--textarea"
              id="quick-log-notes"
              rows={3}
              placeholder="Optional details"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="edit-sheet__actions">
          <button
            className="edit-sheet__btn edit-sheet__btn--primary"
            type="button"
            disabled={createMutation.isPending}
            onClick={handleSubmit}
          >
            {createMutation.isPending ? 'Saving…' : 'Log maintenance'}
          </button>
          {createMutation.error ? (
            <p className="maintenance-form__error" role="alert">
              {(createMutation.error as Error).message}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
