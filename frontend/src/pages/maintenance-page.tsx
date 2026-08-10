import { useState } from 'react';
import { QuickLogSheet } from '../components/quick-log-sheet';
import { MaintenanceForm } from '../components/maintenance-form';
import { UpcomingMaintenanceWidget } from '../components/upcoming-maintenance-widget';
import { useMaintenanceHistory } from '../hooks/use-maintenance-history';
import { useMaintenanceJobs } from '../hooks/use-maintenance-jobs';

export function MaintenancePage() {
  const jobsQuery = useMaintenanceJobs();
  const historyQuery = useMaintenanceHistory();
  const [quickLogJobName, setQuickLogJobName] = useState<string | null>(null);

  const quickLogJob = quickLogJobName
    ? (jobsQuery.data ?? []).find((j) => j.name === quickLogJobName) ?? null
    : null;

  return (
    <section className="page page--maintenance">

      {jobsQuery.isLoading || historyQuery.isLoading ? (
        <section className="maintenance-form-panel">
          <p className="maintenance-form-panel__intro">Loading maintenance form…</p>
        </section>
      ) : null}

      {jobsQuery.isError || historyQuery.isError ? (
        <section className="maintenance-form-panel">
          <p className="maintenance-form__error" role="alert">
            Unable to load maintenance form details right now.
          </p>
        </section>
      ) : null}

      {jobsQuery.data && !jobsQuery.isError && !historyQuery.isError ? (
        <>
          <UpcomingMaintenanceWidget
            currentHours={historyQuery.latestRecord?.printerHours ?? null}
            onJobClick={setQuickLogJobName}
          />
          <MaintenanceForm
            jobs={jobsQuery.data}
            latestPrinterHours={historyQuery.latestRecord?.printerHours ?? null}
          />
        </>
      ) : null}

      {quickLogJob ? (
        <QuickLogSheet
          job={quickLogJob}
          latestPrinterHours={historyQuery.latestRecord?.printerHours ?? null}
          onClose={() => setQuickLogJobName(null)}
        />
      ) : null}
    </section>
  );
}
