import { useEffect, useMemo, useState } from 'react';
import type { MaintenanceJob } from '../api/client';
import { useCreateMaintenanceRecord } from '../hooks/use-create-maintenance-record';
import {
  MAINTENANCE_INTERVAL_GROUPS,
  getDefaultCategoryForJob,
  type MaintenanceCategory,
} from '../lib/maintenance-job-metadata';

interface MaintenanceFormProps {
  jobs: MaintenanceJob[];
  latestPrinterHours: number | null;
}

function formatHours(hours: number) {
  return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)} h`;
}

export function MaintenanceForm({ jobs, latestPrinterHours }: MaintenanceFormProps) {
  const createRecordMutation = useCreateMaintenanceRecord();
  const [selectedJobId, setSelectedJobId] = useState('');
  const [category, setCategory] = useState<MaintenanceCategory>('ROUTINE');
  const [showIntervals, setShowIntervals] = useState(false);
  const [printerHours, setPrinterHours] = useState(() => latestPrinterHours ?? 0);
  const [notes, setNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setPrinterHours(latestPrinterHours ?? 0);
  }, [latestPrinterHours]);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === Number(selectedJobId)) ?? null,
    [jobs, selectedJobId],
  );

  const minHours = latestPrinterHours ?? 0;

  const canSubmit =
    selectedJobId.trim().length > 0 && !createRecordMutation.isPending;

  return (
    <section className="maintenance-form-panel" aria-labelledby="maintenance-form-heading">
      <div className="maintenance-form-panel__header">
        <div>
          <h2 className="panel-heading__title" id="maintenance-form-heading">
            Record maintenance
          </h2>
          <p className="maintenance-form-panel__intro">
            Save what you completed and capture the printer&apos;s current total hours.
          </p>
        </div>
        <button
          aria-expanded={showIntervals}
          aria-controls="recommended-maintenance-windows"
          aria-label="Show recommended maintenance windows"
          className="maintenance-form-panel__info-button"
          type="button"
          onClick={() => setShowIntervals((value) => !value)}
        >
          i
        </button>
      </div>

      {showIntervals ? (
        <div className="maintenance-intervals" id="recommended-maintenance-windows">
          <h3 className="maintenance-intervals__title">Recommended maintenance windows</h3>
          <ul
            aria-label="Recommended maintenance windows list"
            className="maintenance-intervals__list"
          >
            {MAINTENANCE_INTERVAL_GROUPS.map((group) => (
              <li className="maintenance-intervals__item" key={group.intervalHours}>
                <span className="maintenance-intervals__interval">~{group.intervalHours} h</span>
                <ul className="maintenance-intervals__jobs">
                  {group.jobNames.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <form
        className="maintenance-form"
        onSubmit={async (event) => {
          event.preventDefault();

          if (!canSubmit) {
            return;
          }

          setSuccessMessage('');

          try {
            await createRecordMutation.mutateAsync({
              printerHours,
              maintenanceJobId: Number(selectedJobId),
              category,
              notes: notes.trim().length > 0 ? notes.trim() : null,
            });

            setSuccessMessage('Maintenance record saved.');
            setSelectedJobId('');
            setCategory('ROUTINE');
            setNotes('');
          } catch {
            return;
          }
        }}
      >
        <div className="maintenance-form__group">
          <label className="maintenance-form__label" htmlFor="printerHours">
            Printer hours
          </label>
          <input
            className="maintenance-form__input"
            id="printerHours"
            inputMode="numeric"
            max={9999}
            min={minHours}
            name="printerHours"
            step={0.1}
            type="number"
            value={printerHours}
            onChange={(event) => {
              const val = Number(event.target.value);
              setPrinterHours(val < minHours ? minHours : val);
            }}
          />
          <div className="maintenance-form__context">
            <span className="maintenance-form__context-label">Current total hours</span>
            <span className="maintenance-form__context-value">
              {latestPrinterHours === null ? 'No history yet' : formatHours(latestPrinterHours)}
            </span>
          </div>
        </div>

        <div className="maintenance-form__group">
          <label className="maintenance-form__label" htmlFor="maintenanceJob">
            Maintenance job
          </label>
          <select
            className="maintenance-form__input"
            id="maintenanceJob"
            name="maintenanceJob"
            value={selectedJobId}
            onChange={(event) => {
              const nextValue = event.target.value;
              const nextJob = jobs.find((job) => job.id === Number(nextValue)) ?? null;

              setSelectedJobId(nextValue);

              if (nextJob) {
                const defaultCategory = getDefaultCategoryForJob(nextJob.name);
                if (defaultCategory) {
                  setCategory(defaultCategory);
                }
              }
            }}
          >
            <option value="">Select a job</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.name}
              </option>
            ))}
          </select>
          {selectedJob?.description ? (
            <p className="maintenance-form__helper">{selectedJob.description}</p>
          ) : null}
        </div>

        <fieldset className="maintenance-form__group">
          <legend className="maintenance-form__label">Category</legend>
          <div className="maintenance-form__choices">
            <label className="maintenance-form__choice">
              <input
                checked={category === 'ROUTINE'}
                name="category"
                type="radio"
                value="ROUTINE"
                onChange={() => setCategory('ROUTINE')}
              />
              Routine
            </label>
            <label className="maintenance-form__choice">
              <input
                checked={category === 'ERROR'}
                name="category"
                type="radio"
                value="ERROR"
                onChange={() => setCategory('ERROR')}
              />
              Error
            </label>
          </div>
        </fieldset>

        <div className="maintenance-form__group">
          <label className="maintenance-form__label" htmlFor="notes">
            Notes
          </label>
          <textarea
            className="maintenance-form__input maintenance-form__input--textarea"
            id="notes"
            name="notes"
            placeholder="Optional details"
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        <button className="maintenance-form__submit" type="submit">
          {createRecordMutation.isPending ? 'Saving…' : 'Save maintenance record'}
        </button>

        {successMessage ? (
          <p className="maintenance-form__success" role="status">
            {successMessage}
          </p>
        ) : null}

        {createRecordMutation.error ? (
          <p className="maintenance-form__error" role="alert">
            {createRecordMutation.error.message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
