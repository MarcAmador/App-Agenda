import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Validación estricta de variables de entorno al arrancar el servidor.
 * El proceso termina inmediatamente si falta alguna variable requerida.
 */
const envSchema = z.object({
  PORT:                     z.string().default('4000'),
  NODE_ENV:                 z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN:              z.string().default('http://localhost:5180'),
  SUPABASE_URL:             z.string().url({ message: 'SUPABASE_URL debe ser una URL válida' }),
  SUPABASE_ANON_KEY:        z.string().min(10, { message: 'SUPABASE_ANON_KEY es requerido' }),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10, { message: 'SUPABASE_SERVICE_ROLE_KEY es requerido' }),

  // ─── Configuración de Correo SMTP (Gmail, Outlook, Brevo, etc.) ───
  SMTP_HOST:                z.string().optional(),
  SMTP_PORT:                z.string().default('587'),
  SMTP_SECURE:              z.string().default('false'),
  SMTP_USER:                z.string().optional(),
  SMTP_PASS:                z.string().optional(),
  SMTP_FROM:                z.string().default('AgendaPro <notificaciones@agendapro.edu>'),

  // ─── Twilio WhatsApp (Opcional para despacho API) ──────────────────
  TWILIO_ACCOUNT_SID:       z.string().optional(),
  TWILIO_AUTH_TOKEN:        z.string().optional(),
  TWILIO_WHATSAPP_NUMBER:   z.string().optional(),

  // ─── Meta Cloud API WhatsApp (Opcional) ───────────────────────────
  WHATSAPP_API_TOKEN:       z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
})


let parsedEnv: z.infer<typeof envSchema>

try {
  parsedEnv = envSchema.parse(process.env)
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌  Variables de entorno inválidas:\n', error.format())
  } else {
    console.error('❌  Error al inicializar variables de entorno:\n', error)
  }
  process.exit(1)
}

export const env = parsedEnv
