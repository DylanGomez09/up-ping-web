import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { queryClient } from '@/lib/queryClient';
import { ProtectedRoute, PublicOnlyRoute } from '@/router/guards';
import { AppShell } from '@/components/shell/AppShell';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DiagnosticsPage } from '@/pages/DiagnosticsPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

/** Wraps a page in the session guard plus the persistent app chrome. */
function guarded(element: ReactNode) {
  return (
    <ProtectedRoute>
      <AppShell>{element}</AppShell>
    </ProtectedRoute>
  );
}

function RootRedirect() {
  return <Navigate to="/dashboard" replace />;
}

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />

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

            <Route path="/dashboard" element={guarded(<DashboardPage />)} />
            <Route path="/diagnostics" element={guarded(<DiagnosticsPage />)} />
            <Route path="/history" element={guarded(<HistoryPage />)} />
            <Route path="/settings" element={guarded(<SettingsPage />)} />
            <Route path="/profile" element={guarded(<ProfilePage />)} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}