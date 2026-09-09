import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

// PrimeReact — tema y servicios base
import 'primereact/resources/themes/lara-light-blue/theme.css'
import 'primereact/resources/primereact.min.css'
import { PrimeReactProvider } from 'primereact/api'

import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { TourProvider } from '@/context/TourContext'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import TareasPage from '@/pages/TareasPage'
import CalendarioPage from '@/pages/CalendarioPage'
import MatrizPage from '@/pages/MatrizPage'
import ConfigPage from '@/pages/ConfigPage'
import AuthCallbackPage from '@/pages/AuthCallbackPage'
import { AdminRoute } from '@/components/common/AdminRoute'
import AdminLayout from '@/pages/admin/AdminLayout'
import AdminOverviewPage from '@/pages/admin/AdminOverviewPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminTemplatesPage from '@/pages/admin/AdminTemplatesPage'
import AdminEmailsPage from '@/pages/admin/AdminEmailsPage'
import AdminSmtpPage from '@/pages/admin/AdminSmtpPage'
import AdminAuditPage from '@/pages/admin/AdminAuditPage'
import AdminAlertsPage from '@/pages/admin/AdminAlertsPage'
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage'
import AdminGoogleOAuthPage from '@/pages/admin/AdminGoogleOAuthPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PrimeReactProvider>
        <ThemeProvider>
          <AuthProvider>
            <BrowserRouter>
              <TourProvider>
                <Routes>
                {/* Rutas públicas */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />

                {/* Rutas protegidas */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tareas"
                  element={
                    <ProtectedRoute>
                      <TareasPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/calendario"
                  element={
                    <ProtectedRoute>
                      <CalendarioPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/matriz"
                  element={
                    <ProtectedRoute>
                      <MatrizPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/config"
                  element={
                    <ProtectedRoute>
                      <ConfigPage />
                    </ProtectedRoute>
                  }
                />

                {/* Rutas exclusivas del Panel Administrativo (SuperAdmin) */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  }
                >
                  <Route index element={<AdminOverviewPage />} />
                  <Route path="usuarios" element={<AdminUsersPage />} />
                  <Route path="plantillas" element={<AdminTemplatesPage />} />
                  <Route path="emails" element={<AdminEmailsPage />} />
                  <Route path="smtp" element={<AdminSmtpPage />} />
                  <Route path="auditoria" element={<AdminAuditPage />} />
                  <Route path="alertas" element={<AdminAlertsPage />} />
                  <Route path="configuracion" element={<AdminSettingsPage />} />
                  <Route path="oauth" element={<AdminGoogleOAuthPage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </TourProvider>
            </BrowserRouter>

            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--b1)',
                  color: 'var(--bc)',
                  border: '1px solid var(--b3)',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </PrimeReactProvider>
    </QueryClientProvider>
  )
}
