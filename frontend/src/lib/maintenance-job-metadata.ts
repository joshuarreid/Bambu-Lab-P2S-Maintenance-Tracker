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
 * Returns the next `maxGroups` upcoming maintenance groups sorted by when
 * they are due (ascending). Groups with the same nextDue hour are treated as
 * separate entries — don't merge them, their intervals are coincidentally aligned.
 *
 * If any group beyond the first has more than `largeGroupThreshold` jobs, all
 * jobs in that group are still returned (no truncation).
 */
export function getUpcomingMaintenanceGroups(
  currentHours: number,
  maxGroups = 3,
): UpcomingMaintenanceGroup[] {
  const withNextDue = MAINTENANCE_INTERVAL_GROUPS.map((group) => {
    const nextDueHours =
      Math.floor(currentHours / group.intervalHours) * group.intervalHours +
      group.intervalHours;
    return {
      nextDueHours,
      hoursAway: Math.max(0, nextDueHours - currentHours),
      jobNames: group.jobNames,
    };
  });

  withNextDue.sort((a, b) => a.nextDueHours - b.nextDueHours || a.hoursAway - b.hoursAway);

  return withNextDue.slice(0, maxGroups);
}

export function getDefaultCategoryForJob(jobName: string): MaintenanceCategory | null {
  return DEFAULT_CATEGORY_BY_JOB_NAME[jobName] ?? null;
}
