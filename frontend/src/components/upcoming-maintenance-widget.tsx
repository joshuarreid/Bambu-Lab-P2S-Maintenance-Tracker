import { getUpcomingMaintenanceGroups } from '../lib/maintenance-job-metadata';

interface UpcomingMaintenanceWidgetProps {
  currentHours: number | null;
}

function urgencyClass(hoursAway: number): string {
  if (hoursAway <= 10) return 'upcoming-widget__hours-away--urgent';
  if (hoursAway <= 50) return 'upcoming-widget__hours-away--soon';
  return 'upcoming-widget__hours-away--ok';
}

export function UpcomingMaintenanceWidget({ currentHours }: UpcomingMaintenanceWidgetProps) {
  const hours = currentHours ?? 0;
  const groups = getUpcomingMaintenanceGroups(hours, 3);

  return (
    <section className="upcoming-widget" aria-label="Upcoming maintenance">
      <h3 className="upcoming-widget__heading">Next up</h3>
      <ol className="upcoming-widget__list" aria-label="Upcoming maintenance checkpoints">
        {groups.map((group) => (
          <li className="upcoming-widget__checkpoint" key={group.nextDueHours}>
            <div className="upcoming-widget__checkpoint-meta">
              <span className="upcoming-widget__due-hours">{group.nextDueHours} hours</span>
              <span className={`upcoming-widget__hours-away ${urgencyClass(group.hoursAway)}`}>
                in ~{Math.round(group.hoursAway)} h
              </span>
            </div>
            <ul className="upcoming-widget__jobs">
              {group.jobNames.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      {currentHours === null ? (
        <p className="upcoming-widget__no-history">
          Log your first maintenance record to see tailored estimates.
        </p>
      ) : null}
    </section>
  );
}
