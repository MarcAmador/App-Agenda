import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

// PrimeReact v10 — tema y servicios base
import 'primereact/resources/themes/lara-light-blue/theme.css'
import 'primereact/resources/primereact.min.css'
import { PrimeReactProvider } from 'primereact/api'

import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { UiPreferencesProvider } from '@/context/UiPreferencesContext'
import { TourProvider } from '@/context/TourContext'
import { FocusTimerProvider } from '@/context/FocusTimerContext'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { AdminRoute } from '@/components/common/AdminRoute'

// Páginas core cargadas inmediatamente para experiencia instantánea
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import TareasPage from '@/pages/TareasPage'
import AuthCallbackPage from '@/pages/AuthCallbackPage'

// Páginas secundarias y administrativas con carga diferida (Code-Splitting)
const CalendarioPage = lazy(() => import('@/pages/CalendarioPage'))
const MatrizPage = lazy(() => import('@/pages/MatrizPage'))
const ConfigPage = lazy(() => import('@/pages/ConfigPage'))

const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'))
const AdminOverviewPage = lazy(() => import('@/pages/admin/AdminOverviewPage'))
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'))
const AdminTemplatesPage = lazy(() => import('@/pages/admin/AdminTemplatesPage'))
const AdminEmailsPage = lazy(() => import('@/pages/admin/AdminEmailsPage'))
const AdminSmtpPage = lazy(() => import('@/pages/admin/AdminSmtpPage'))
const AdminAuditPage = lazy(() => import('@/pages/admin/AdminAuditPage'))
const AdminAlertsPage = lazy(() => import('@/pages/admin/AdminAlertsPage'))
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'))
const AdminGoogleOAuthPage = lazy(() => import('@/pages/admin/AdminGoogleOAuthPage'))
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'))
const TermsOfServicePage = lazy(() => import('@/pages/TermsOfServicePage'))

// ─── Prefetching en tiempo ocioso (Idle) para navegación 100% instantánea ─────
const preloadSecondaryRoutes = () => {
  import('@/pages/CalendarioPage')
  import('@/pages/MatrizPage')
  import('@/pages/ConfigPage')
}

if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(preloadSecondaryRoutes)
  } else {
    setTimeout(preloadSecondaryRoutes, 1500)
  }
}

function PageLoader() {
  return (
    <div className="w-full min-h-[30vh] flex flex-col items-center justify-center gap-2 py-8 animate-fade-in">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
      </div>
      <span className="text-[11px] text-base-content/40 font-medium tracking-wide">Cargando...</span>
    </div>
  )
}

// ─── QueryClient con caché agresiva para reducir peticiones redundantes ────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 minutos — datos fresh durante navegación normal
      gcTime: 1000 * 60 * 15,     // Mantener en cache 15 min sin re-fetch al volver a la página
      retry: 1,
      refetchOnWindowFocus: false, // Evitar re-fetch al cambiar de pestaña del navegador
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
              <UiPreferencesProvider>
                <TourProvider>
                  <FocusTimerProvider>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        {/* Rutas públicas y legales */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/auth/callback" element={<AuthCallbackPage />} />
                        <Route path="/privacidad" element={<PrivacyPolicyPage />} />
                        <Route path="/privacy" element={<PrivacyPolicyPage />} />
                        <Route path="/terminos" element={<TermsOfServicePage />} />
                        <Route path="/terms" element={<TermsOfServicePage />} />

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
                          path="/kanban"
                          element={
                            <ProtectedRoute>
                              <TareasPage initialView="kanban" />
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
                    </Suspense>

                    <Toaster
                      position="top-right"
                      toastOptions={{
                        duration: 4000,
                        style: {
                          background: 'oklch(var(--b1) / 0.96)',
                          backdropFilter: 'blur(16px)',
                          WebkitBackdropFilter: 'blur(16px)',
                          color: 'oklch(var(--bc))',
                          border: '1px solid oklch(var(--b3) / 0.8)',
                          borderRadius: '1rem',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          boxShadow: '0 20px 30px -8px rgba(0, 0, 0, 0.25), 0 4px 12px -2px rgba(0, 0, 0, 0.12)',
                          padding: '12px 16px',
                        },
                        success: {
                          iconTheme: {
                            primary: 'oklch(var(--su))',
                            secondary: '#ffffff',
                          },
                        },
                        error: {
                          iconTheme: {
                            primary: 'oklch(var(--er))',
                            secondary: '#ffffff',
                          },
                        },
                      }}
                    />
                  </FocusTimerProvider>
                </TourProvider>
              </UiPreferencesProvider>
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </PrimeReactProvider>
    </QueryClientProvider>
  )
}
