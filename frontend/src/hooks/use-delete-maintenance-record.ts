import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteMaintenanceRecord } from '../api/client';

export function useDeleteMaintenanceRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => deleteMaintenanceRecord(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['maintenance-history'] });
    },
  });
}
