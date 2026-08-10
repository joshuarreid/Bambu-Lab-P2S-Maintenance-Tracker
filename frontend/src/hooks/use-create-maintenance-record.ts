import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ApiError,
  createMaintenanceRecord,
  type CreateMaintenanceRecordInput,
} from '../api/client';

export function useCreateMaintenanceRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMaintenanceRecordInput) =>
      (await createMaintenanceRecord(input)).record,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['maintenance-history'] });
    },
    meta: {
      errorClass: ApiError,
    },
  });
}
