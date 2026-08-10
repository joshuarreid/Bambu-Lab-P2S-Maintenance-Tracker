import { MaintenanceForm } from '../components/maintenance-form';
import { UpcomingMaintenanceWidget } from '../components/upcoming-maintenance-widget';
import { useMaintenanceHistory } from '../hooks/use-maintenance-history';
import { useMaintenanceJobs } from '../hooks/use-maintenance-jobs';

export function MaintenancePage() {
  const jobsQuery = useMaintenanceJobs();
  const historyQuery = useMaintenanceHistory();

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
          />
          <MaintenanceForm
            jobs={jobsQuery.data}
            latestPrinterHours={historyQuery.latestRecord?.printerHours ?? null}
          />
        </>
      ) : null}
    </section>
  );
}
