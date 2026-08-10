import { useQuery } from '@tanstack/react-query';
import { getAuthSession } from '../api/client';

export function useAuthSession() {
  return useQuery({
    queryKey: ['auth-session'],
    queryFn: getAuthSession,
    retry: false,
  });
}
