import type { ReactNode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { queryClient } from '@/lib/queryClient';
import { HydratedRoute, ProtectedRoute, PublicOnlyRoute } from '@/router/guards';
import { AppShell } from '@/components/shell/AppShell';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DiagnosticsPage } from '@/pages/DiagnosticsPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

/** Public app chrome: measuring works without an account. */
function publicShell(element: ReactNode) {
  return (
    <HydratedRoute>
      <AppShell>{element}</AppShell>
    </HydratedRoute>
  );
}

/** Account-only page inside the app chrome. */
function guarded(element: ReactNode) {
  return (
    <ProtectedRoute>
      <AppShell>{element}</AppShell>
    </ProtectedRoute>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <RegisterPage />
                </PublicOnlyRoute>
              }
            />

            <Route path="/dashboard" element={publicShell(<DashboardPage />)} />
            <Route path="/diagnostics" element={publicShell(<DiagnosticsPage />)} />
            <Route path="/history" element={publicShell(<HistoryPage />)} />
            <Route path="/settings" element={publicShell(<SettingsPage />)} />
            <Route path="/profile" element={guarded(<ProfilePage />)} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
