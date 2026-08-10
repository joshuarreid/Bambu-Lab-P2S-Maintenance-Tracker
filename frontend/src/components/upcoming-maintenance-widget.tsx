import type { MaintenanceHistoryRecord } from '../api/client';
import { getUpcomingMaintenanceGroups } from '../lib/maintenance-job-metadata';

interface UpcomingMaintenanceWidgetProps {
  currentHours: number | null;
  history: MaintenanceHistoryRecord[];
  onJobClick: (name: string) => void;
}

function urgencyClass(overdue: boolean, hoursAway: number): string {
  if (overdue) return 'upcoming-widget__hours-away--overdue';
  if (hoursAway <= 10) return 'upcoming-widget__hours-away--urgent';
  if (hoursAway <= 50) return 'upcoming-widget__hours-away--soon';
  return 'upcoming-widget__hours-away--ok';
}

export function UpcomingMaintenanceWidget({ currentHours, history, onJobClick }: UpcomingMaintenanceWidgetProps) {
  const hours = currentHours ?? 0;
  const groups = getUpcomingMaintenanceGroups(hours, history, 3);

  return (
    <section className="upcoming-widget" aria-label="Upcoming maintenance">
      <h3 className="upcoming-widget__heading">Next up</h3>
      <ol className="upcoming-widget__list" aria-label="Upcoming maintenance checkpoints">
        {groups.map((group) => (
          <li className="upcoming-widget__checkpoint" key={group.nextDueHours}>
            <div className="upcoming-widget__checkpoint-meta">
              <span className="upcoming-widget__due-hours">
                {group.overdue ? `${group.nextDueHours} h` : `${group.nextDueHours} hours`}
              </span>
              <span className={`upcoming-widget__hours-away ${urgencyClass(group.overdue, group.hoursAway)}`}>
                {group.overdue
                  ? `overdue ~${Math.round(group.hoursAway)} h`
                  : `in ~${Math.round(group.hoursAway)} h`}
              </span>
            </div>
            <ul className="upcoming-widget__jobs">
              {group.jobNames.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    className="upcoming-widget__job-btn"
                    onClick={() => onJobClick(name)}
                  >
                    {name}
                  </button>
                </li>
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
