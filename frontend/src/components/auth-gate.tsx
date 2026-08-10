import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthSession } from '../hooks/use-auth-session';

export function AuthGate() {
  const location = useLocation();
  const sessionQuery = useAuthSession();

  if (sessionQuery.isLoading) {
    return (
      <section className="page page--auth">
        <p className="auth-page__status">Checking your session…</p>
      </section>
    );
  }

  if (!sessionQuery.data?.authenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
