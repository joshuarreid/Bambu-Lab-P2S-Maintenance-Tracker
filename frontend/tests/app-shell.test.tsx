import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app';
import { AppRoutes } from '../src/router';

let sessionAuthenticated = true;

function renderApp(initialEntries: string[]) {
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
      queryClient={new QueryClient()}
    />,
  );
}

beforeEach(() => {
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
      return new Response(JSON.stringify({ jobs: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (path === '/api/maintenance' && (!init?.method || init.method === 'GET')) {
      return new Response(JSON.stringify({ records: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
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

describe('App shell', () => {
  it('renders the Maintenance route by default', async () => {
    renderApp(['/']);

    expect(await screen.findByRole('heading', { name: 'Record maintenance' })).toBeInTheDocument();
    expect(await screen.findByLabelText('Maintenance job')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Maintenance' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('renders the History route when opened directly', async () => {
    renderApp(['/history']);

    expect(await screen.findByRole('heading', { name: 'History' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'History' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('switches routes from the bottom navigation without a page reload', async () => {
    renderApp(['/']);

    fireEvent.click(await screen.findByRole('link', { name: 'History' }));

    expect(await screen.findByRole('heading', { name: 'History' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'History' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('shows the login screen when no session exists', async () => {
    sessionAuthenticated = false;

    renderApp(['/']);

    expect(await screen.findByRole('heading', { name: 'Sign in to continue' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue with Google' })).toHaveAttribute(
      'href',
      '/api/auth/google/start?returnTo=%2F',
    );
  });
});
