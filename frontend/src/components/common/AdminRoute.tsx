import { type ReactNode, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

const SUPER_ADMIN_EMAILS = [
  'ronaldo22amador@gmail.com',
  'marlon21ronaldo@gmail.com',
]

interface AdminRouteProps {
  children: ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated || !user) {
      setIsAuthorized(false)
      return
    }

    const email = user.email?.toLowerCase() || ''
    const isOwner = SUPER_ADMIN_EMAILS.includes(email)
    const userRole = user.app_metadata?.role || user.user_metadata?.role

    if (isOwner || userRole === 'super_admin' || userRole === 'admin') {
      setIsAuthorized(true)
    } else {
      setIsAuthorized(false)
      toast.error('Acceso denegado: Se requieren permisos de administrador.', {
        id: 'admin-denied',
      })
    }
  }, [user, isLoading, isAuthenticated])

  if (isLoading || isAuthorized === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-200">
        <span className="loading loading-infinity loading-lg text-primary"></span>
        <p className="mt-4 text-sm font-medium text-base-content/70">
          Verificando privilegios de Administrador...
        </p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isAuthorized) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
