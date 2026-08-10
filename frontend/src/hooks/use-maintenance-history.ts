import { useQuery } from '@tanstack/react-query';
import { getMaintenanceHistory } from '../api/client';

export function useMaintenanceHistory() {
  const query = useQuery({
    queryKey: ['maintenance-history'],
    queryFn: async () => (await getMaintenanceHistory()).records,
  });

  return {
    ...query,
    latestRecord: query.data?.[0] ?? null,
  };
}
