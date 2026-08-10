import type { MaintenanceHistoryRecord } from '../api/client';
import type { CreateMaintenanceRecordInput } from '../api/client';

export type MaintenanceCategory = CreateMaintenanceRecordInput['category'];

export interface MaintenanceIntervalGroup {
  /** Average of the recommended interval range, in printer hours. */
  intervalHours: number;
  jobNames: string[];
}

export interface UpcomingMaintenanceGroup {
  nextDueHours: number;
  hoursAway: number;
  overdue: boolean;
  jobNames: string[];
}

const DEFAULT_CATEGORY_BY_JOB_NAME: Record<string, MaintenanceCategory> = {
  'Clean XY rods': 'ROUTINE',
  'Lubricate XY motion system': 'ROUTINE',
  'Clean & grease Z lead screws': 'ROUTINE',
  'Inspect belts': 'ROUTINE',
  'Inspect idlers': 'ROUTINE',
  'Lubricate idler pulleys': 'ROUTINE',
  'Clean extruder gears': 'ROUTINE',
  'Clean hotend/nozzle': 'ROUTINE',
  'Replace hotend/nozzle': 'ROUTINE',
  'Inspect filament cutter': 'ROUTINE',
  'Replace filament cutter': 'ROUTINE',
  'Inspect nozzle wiper': 'ROUTINE',
  'Replace nozzle wiper': 'ROUTINE',
  'Inspect PTFE tubes': 'ROUTINE',
  'Replace PTFE tube': 'ROUTINE',
  'Clean fans': 'ROUTINE',
  'Clean sensors/camera': 'ROUTINE',
  'Deep Z-axis maintenance': 'ROUTINE',
  'Full printer inspection': 'ROUTINE',
  'Clear nozzle clog': 'ERROR',
  'Fix filament feeding issue': 'ERROR',
  'Fix extrusion issue': 'ERROR',
  'Fix abnormal noise': 'ERROR',
  'Fix layer adhesion/quality issue': 'ERROR',
  'Fix failed print issue': 'ERROR',
  'Belt adjustment': 'ERROR',
  'Idler adjustment/replacement': 'ERROR',
  'Hotend replacement': 'ERROR',
  'Extruder repair': 'ERROR',
};

/**
 * All scheduled maintenance intervals, grouped by the average of the
 * manufacturer's recommended range, sorted from shortest to longest interval.
 *
 * "As needed" / wear-dependent jobs are excluded — they have no fixed cadence.
 */
export const MAINTENANCE_INTERVAL_GROUPS: MaintenanceIntervalGroup[] = [
  {
    intervalHours: 15, // avg of 10–20
    jobNames: ['Clean build plate'],
  },
  {
    intervalHours: 30, // avg of 20–40
    jobNames: ['Remove filament debris'],
  },
  {
    intervalHours: 110, // avg of 100–120
    jobNames: ['Clean XY rods', 'Lubricate XY motion system'],
  },
  {
    intervalHours: 150, // avg of 100–200
    jobNames: [
      'Inspect belts',
      'Inspect idlers',
      'Inspect filament cutter',
      'Inspect nozzle wiper',
      'Clean fans',
      'Clean sensors/camera',
    ],
  },
  {
    intervalHours: 300,
    jobNames: ['Deep Z-axis maintenance'],
  },
  {
    intervalHours: 400, // avg of 300–500
    jobNames: [
      'Clean & grease Z lead screws',
      'Lubricate idler pulleys',
      'Clean extruder gears',
      'Inspect PTFE tubes',
    ],
  },
  {
    intervalHours: 500,
    jobNames: ['Full printer inspection'],
  },
];

/**
 * Returns upcoming and overdue maintenance groups.
 *
 * For each interval group, the last matching history record determines when
 * that group was last serviced. If no record exists, lastDoneAt = 0.
 * Groups where nextDueHours <= currentHours are overdue.
 *
 * Overdue groups are shown first (most overdue first), followed by the next
 * `maxUpcoming` upcoming groups (soonest first).
 */
export function getUpcomingMaintenanceGroups(
  currentHours: number,
  history: MaintenanceHistoryRecord[],
  maxUpcoming = 3,
): UpcomingMaintenanceGroup[] {
  const groups = MAINTENANCE_INTERVAL_GROUPS.map((group) => {
    // Find the most recent record for any job in this group.
    const lastRecord = history.find((r) => group.jobNames.includes(r.maintenanceJobName));
    const lastDoneAt = lastRecord?.printerHours ?? 0;
    const nextDueHours = lastDoneAt + group.intervalHours;
    const rawAway = nextDueHours - currentHours;
    return {
      nextDueHours,
      hoursAway: Math.abs(rawAway),
      overdue: rawAway <= 0,
      jobNames: group.jobNames,
    };
  });

  const overdue = groups
    .filter((g) => g.overdue)
    .sort((a, b) => b.hoursAway - a.hoursAway); // most overdue first

  const upcoming = groups
    .filter((g) => !g.overdue)
    .sort((a, b) => a.hoursAway - b.hoursAway) // soonest first
    .slice(0, maxUpcoming);

  return [...overdue, ...upcoming];
}

export function getDefaultCategoryForJob(jobName: string): MaintenanceCategory | null {
  return DEFAULT_CATEGORY_BY_JOB_NAME[jobName] ?? null;
}
