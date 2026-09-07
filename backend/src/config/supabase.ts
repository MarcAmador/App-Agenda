import { createClient } from '@supabase/supabase-js'
import { env } from './env'

/**
 * Cliente de Supabase con SERVICE_ROLE_KEY para operaciones privilegiadas del backend:
 * - Dispatcher de notificaciones (acceso cross-user)
 * - Operaciones administrativas
 *
 * NUNCA exponer este cliente al frontend.
 */
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

/**
 * Crea un cliente de Supabase contextualizado con el JWT del usuario autenticado.
 * Se usa en los middlewares de ruta para aplicar RLS correctamente.
 */
export function createUserClient(jwtToken: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
