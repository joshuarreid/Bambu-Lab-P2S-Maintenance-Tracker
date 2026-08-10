import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMaintenanceRecord, type CreateMaintenanceRecordInput } from '../api/client';

export function useUpdateMaintenanceRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: CreateMaintenanceRecordInput }) =>
      (await updateMaintenanceRecord(id, input)).record,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['maintenance-history'] });
    },
  });
}
