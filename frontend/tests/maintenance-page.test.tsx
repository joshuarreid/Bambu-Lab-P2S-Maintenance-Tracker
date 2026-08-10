import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app';
import { AppRoutes } from '../src/router';

const jobs = [
  {
    id: 1,
    name: 'Clean XY rods',
    description: 'Routine rod cleaning',
    active: true,
    createdAt: '2026-08-09T00:00:00.000Z',
  },
  {
    id: 2,
    name: 'Clear nozzle clog',
    description: 'Fix a clog',
    active: true,
    createdAt: '2026-08-09T00:00:00.000Z',
  },
  {
    id: 3,
    name: 'Other',
    description: 'Catch-all',
    active: true,
    createdAt: '2026-08-09T00:00:00.000Z',
  },
];

const initialRecords = [
  {
    id: 1,
    printerHours: 120.5,
    maintenanceJobId: 1,
    maintenanceJobName: 'Clean XY rods',
    category: 'ROUTINE',
    notes: null,
    createdAt: '2026-08-09T18:42:00.000Z',
  },
];

let records = [...initialRecords];
let failNextCreateRequest = false;
let failJobsRequest = false;
let sessionAuthenticated = true;

function renderApp(initialEntries: string[] = ['/']) {
  render(
    <App
      router={
        <MemoryRouter
          initialEntries={initialEntries}
          future={{
            v7_relativeSplatPath: true,
            v7_startTransition: true,
          }}
        >
          <AppRoutes />
        </MemoryRouter>
      }
      queryClient={
        new QueryClient({
          defaultOptions: {
            queries: {
              retry: false,
              refetchOnWindowFocus: false,
            },
          },
        })
      }
    />,
  );
}

beforeEach(() => {
  records = [...initialRecords];
  failNextCreateRequest = false;
  failJobsRequest = false;
  sessionAuthenticated = true;

  global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = typeof input === 'string' ? input : input.toString();

    if (path === '/api/auth/session') {
      return new Response(
        JSON.stringify(
          sessionAuthenticated
            ? {
                authenticated: true,
                user: {
                  id: 1,
                  email: 'jacky@example.com',
                  displayName: 'Jacky',
                  avatarUrl: null,
                },
              }
            : {
                authenticated: false,
                user: null,
              },
        ),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (path === '/api/maintenance/jobs') {
      if (failJobsRequest) {
        return new Response(
          JSON.stringify({
            error: {
              code: 'JOBS_UNAVAILABLE',
              message: 'Jobs are unavailable.',
            },
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      return new Response(JSON.stringify({ jobs }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (path === '/api/maintenance' && (!init?.method || init.method === 'GET')) {
      return new Response(JSON.stringify({ records }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (path === '/api/maintenance' && init?.method === 'POST') {
      if (failNextCreateRequest) {
        return new Response(
          JSON.stringify({
            error: {
              code: 'NETWORK_UNAVAILABLE',
              message: 'Unable to save the maintenance record right now.',
            },
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      const payload = JSON.parse(String(init.body)) as {
        printerHours: number;
        maintenanceJobId: number;
        category: 'ROUTINE' | 'ERROR';
        notes?: string | null;
      };
      const selectedJob = jobs.find((job) => job.id === payload.maintenanceJobId);
      const createdRecord = {
        id: records.length + 1,
        printerHours: payload.printerHours,
        maintenanceJobId: payload.maintenanceJobId,
        maintenanceJobName: selectedJob?.name ?? 'Unknown',
        category: payload.category,
        notes: payload.notes ?? null,
        createdAt: '2026-08-09T19:00:00.000Z',
      };

      records = [createdRecord, ...records];

      return new Response(
        JSON.stringify({
          record: {
            id: createdRecord.id,
            printerHours: createdRecord.printerHours,
            maintenanceJobId: createdRecord.maintenanceJobId,
            category: createdRecord.category,
            notes: createdRecord.notes,
            createdAt: createdRecord.createdAt,
          },
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(JSON.stringify({ error: { code: 'UNEXPECTED', message: 'Unexpected request' } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Maintenance page', () => {
  it('defaults category based on the selected maintenance job', async () => {
    renderApp();

    const jobSelect = await screen.findByLabelText('Maintenance job');
    const routineRadio = screen.getByLabelText('Routine');
    const errorRadio = screen.getByLabelText('Error');

    fireEvent.change(jobSelect, { target: { value: '2' } });
    expect(errorRadio).toBeChecked();

    fireEvent.change(jobSelect, { target: { value: '1' } });
    expect(routineRadio).toBeChecked();

    fireEvent.change(jobSelect, { target: { value: '3' } });
    expect(routineRadio).toBeChecked();
  });

  it('shows recommended maintenance windows from the info icon', async () => {
    renderApp();

    fireEvent.click(await screen.findByRole('button', { name: 'Show recommended maintenance windows' }));

    const panel = await screen.findByText('Recommended maintenance windows');
    expect(panel).toBeInTheDocument();
    const intervals = screen.getByRole('list', {
      name: 'Recommended maintenance windows list',
    });
    expect(within(intervals).getByText('Clean build plate')).toBeInTheDocument();
    expect(within(intervals).getByText('~15 h')).toBeInTheDocument();
  });

  it('shows the latest recorded hours context', async () => {
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('Current total hours')).toBeInTheDocument();
    });

    expect(screen.getByText('120.5 h')).toBeInTheDocument();
  });

  it('defaults the hours input to the latest recorded hours', async () => {
    renderApp();

    const dial = await screen.findByRole('spinbutton', { name: 'Printer hours' });

    expect(dial).toHaveValue(120.5);
  });

  it('defaults the hours input to 0 when there is no history', async () => {
    records = [];
    renderApp();

    const dial = await screen.findByRole('spinbutton', { name: 'Printer hours' });

    expect(dial).toHaveValue(0);
  });

  it('renders the maintenance form in the main maintenance body', async () => {
    renderApp();

    const formHeading = await screen.findByRole('heading', { name: 'Record maintenance' });
    expect(formHeading).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Printer overview' })).not.toBeInTheDocument();
    expect(screen.queryByText('Device Idle')).not.toBeInTheDocument();
  });

  it('submits a maintenance record and refreshes the latest hours context', async () => {
    renderApp();

    await screen.findByLabelText('Maintenance job');

    fireEvent.change(screen.getByLabelText('Maintenance job'), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByLabelText('Notes'), {
      target: { value: 'Cleared a clog at the nozzle' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save maintenance record' }));

    expect(await screen.findByText('Maintenance record saved.')).toBeInTheDocument();
    expect(await screen.findByText('120.5 h')).toBeInTheDocument();
  });

  it('shows a clear error message when the record cannot be saved', async () => {
    failNextCreateRequest = true;
    renderApp();

    await screen.findByLabelText('Maintenance job');

    fireEvent.change(screen.getByLabelText('Maintenance job'), {
      target: { value: '2' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save maintenance record' }));

    expect(
      await screen.findByText('Unable to save the maintenance record right now.'),
    ).toBeInTheDocument();
  });

  it('shows a clear error when the form data cannot be loaded', async () => {
    failJobsRequest = true;
    renderApp();

    expect(
      await screen.findByText('Unable to load maintenance form details right now.'),
    ).toBeInTheDocument();
  });
});
