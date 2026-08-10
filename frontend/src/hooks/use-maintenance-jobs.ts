import { useQuery } from '@tanstack/react-query';
import { getMaintenanceJobs } from '../api/client';

export function useMaintenanceJobs() {
  return useQuery({
    queryKey: ['maintenance-jobs'],
    queryFn: async () => (await getMaintenanceJobs()).jobs,
  });
}
