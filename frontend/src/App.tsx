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
