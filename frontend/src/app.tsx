import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { createAppQueryClient } from './lib/query-client';
import { AppRoutes } from './router';
const defaultQueryClient = createAppQueryClient();

interface AppProps {
  router?: ReactElement;
  queryClient?: QueryClient;
}

export function App({
  router = (
    <BrowserRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <AppRoutes />
    </BrowserRouter>
  ),
  queryClient = defaultQueryClient,
}: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {router}
    </QueryClientProvider>
  );
}
