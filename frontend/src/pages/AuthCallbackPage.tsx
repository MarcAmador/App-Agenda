import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

/**
 * Página de callback del flujo OAuth de Google y flujos de recuperación de contraseña.
 * Supabase redirige aquí tras autenticar al usuario con Google o tras hacer clic en el enlace de recuperación.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // Escuchamos el evento para redirigir al usuario a su destino
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/login?mode=reset-password', { replace: true })
      } else if (event === 'SIGNED_IN') {
        // Si no es recuperación, redirigir al dashboard
        const hash = window.location.hash
        const search = window.location.search
        if (!hash.includes('type=recovery') && !search.includes('type=recovery')) {
          navigate('/', { replace: true })
        }
      } else if (event === 'SIGNED_OUT') {
        navigate('/login', { replace: true })
      }
    })

    // Verificamos si en el hash o query params viene type=recovery explícito
    const hash = window.location.hash
    const search = window.location.search
    if (hash.includes('type=recovery') || search.includes('type=recovery')) {
      navigate('/login?mode=reset-password', { replace: true })
    }

    return () => subscription.unsubscribe()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <span className="loading loading-ring loading-lg text-primary" />
        <p className="text-base-content/60 text-sm font-medium">
          Verificando credenciales de acceso...
        </p>
      </div>
    </div>
  )
}
