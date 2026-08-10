import { Route, Routes } from 'react-router-dom';
import { AuthGate } from './components/auth-gate';
import { AppShell } from './components/app-shell';
import { HistoryPage } from './pages/history-page';
import { LoginPage } from './pages/login-page';
import { MaintenancePage } from './pages/maintenance-page';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AuthGate />}>
        <Route path="/" element={<AppShell />}>
          <Route index element={<MaintenancePage />} />
          <Route path="history" element={<HistoryPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
