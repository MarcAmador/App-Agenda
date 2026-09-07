import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

/**
 * Página de callback del flujo OAuth de Google.
 * Supabase redirige aquí tras autenticar al usuario con Google.
 * El SDK detecta automáticamente los tokens en la URL y establece la sesión.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase detecta los parámetros de la URL (code, state) y cambia el estado de auth.
    // Escuchamos el evento para redirigir al usuario a su destino.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        navigate('/', { replace: true })
      } else if (event === 'SIGNED_OUT') {
        navigate('/login', { replace: true })
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <span className="loading loading-ring loading-lg text-primary" />
        <p className="text-base-content/60 text-sm font-medium">
          Completando inicio de sesión...
        </p>
      </div>
    </div>
  )
}
