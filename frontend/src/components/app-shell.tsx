import { Outlet } from 'react-router-dom';
import { BottomNav } from './bottom-nav';
import { useAuthSession } from '../hooks/use-auth-session';

export function AppShell() {
  const sessionQuery = useAuthSession();
  const user = sessionQuery.data?.user;
  const displayName = user?.displayName ?? 'Maintenance user';

  return (
    <div className="shell" data-testid="app-shell">
      <header className="shell__topbar">
        <div className="shell__brand">
          <div className="shell__brand-mark" aria-hidden="true">
            <span className="shell__brand-tile shell__brand-tile--tall" />
            <span className="shell__brand-tile" />
            <span className="shell__brand-tile" />
          </div>
          <span className="shell__brand-name">Bambu P2S</span>
        </div>

        <div className="shell__identity">
          <span className="shell__identity-name">{displayName}</span>
          <a className="shell__logout-link" href="/api/auth/logout">
            Sign out
          </a>
        </div>
      </header>
      <main className="shell__main">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
