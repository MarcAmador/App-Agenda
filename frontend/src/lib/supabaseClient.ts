import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Variables de entorno inyectadas por Vite en tiempo de build.
 * Las variables VITE_* son las únicas expuestas al cliente.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[supabaseClient] Las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY son requeridas. ' +
    'Copia .env.example a .env y configura tus credenciales de Supabase.'
  )
}

/**
 * Cliente de Supabase tipado con el schema de la base de datos.
 * Se utiliza en toda la aplicación para queries, auth y realtime.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persiste la sesión en localStorage para sobrevivir recargas de página
    persistSession: true,
    // Detecta automáticamente el callback de OAuth en la URL
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
})
