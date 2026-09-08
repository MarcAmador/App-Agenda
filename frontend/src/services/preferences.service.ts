import { supabase } from '@/lib/supabaseClient'
import type {
  UserPreferences,
  UpdateUserPreferencesInput,
  ReminderLog,
  NotificationChannel,
} from '@/types/database.types'

/**
 * Obtiene las preferencias del usuario actual.
 * Si aún no existen, inserta un registro por defecto y lo devuelve.
 */
export async function getUserPreferences(): Promise<UserPreferences> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error

  if (!data) {
    const defaults = {
      user_id: user.id,
      notification_channels: ['email' as NotificationChannel],
      phone_number: null,
      telegram_chat_id: null,
      reminder_lead_time_minutes: 60,
      theme: 'system' as const,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: created, error: insertError } = await (supabase.from('user_preferences') as any)
      .insert(defaults)
      .select()
      .single()

    if (insertError) throw insertError
    return created as UserPreferences
  }

  return data as UserPreferences
}

/**
 * Actualiza las preferencias del usuario actual en Supabase.
 */
export async function updateUserPreferences(
  input: UpdateUserPreferencesInput
): Promise<UserPreferences> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('user_preferences') as any)
    .update(input)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data as UserPreferences
}

export interface ReminderLogWithTask extends ReminderLog {
  tasks?: {
    title: string
    due_date: string | null
    priority: string
  } | null
}

/**
 * Obtiene el historial de recordatorios y notificaciones enviadas.
 */
export async function getReminderLogs(limit = 20): Promise<ReminderLogWithTask[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  const { data, error } = await supabase
    .from('reminder_logs')
    .select('*, tasks(title, due_date, priority)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as unknown as ReminderLogWithTask[]
}

export interface TestNotificationResponse {
  message: string
  result?: {
    channel: NotificationChannel
    success: boolean
    messageId?: string
    error?: string
    previewUrl?: string
    directUrl?: string
    sentAt: string
  }
}

/**
 * Dispara una notificación de prueba hacia el canal especificado vía Backend API
 */
export async function sendTestNotification(
  channel: NotificationChannel,
  destination?: string
): Promise<TestNotificationResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

  try {
    const res = await fetch(`${backendUrl}/api/v1/reminders/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token ?? ''}`,
      },
      body: JSON.stringify({ channel, destination }),
    })

    const body = await res.json()
    if (!res.ok) {
      throw new Error(body.error || 'Error al enviar notificación de prueba')
    }

    return body as TestNotificationResponse
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error(
        `No se pudo conectar con el backend (${backendUrl}). Verifica que el servidor de Node.js esté corriendo en el puerto 4000.`
      )
    }
    throw err
  }
}

export interface SmtpStatus {
  configured: boolean
  user: string | null
  host: string
  from: string | null
  isGmail: boolean
}

/**
 * Consulta el estado de configuración del motor de correo SMTP en el backend
 */
export async function getSmtpStatus(): Promise<SmtpStatus> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'
  const res = await fetch(`${backendUrl}/api/v1/reminders/smtp-status`, {
    headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
  })
  if (!res.ok) throw new Error('Error al consultar estado SMTP')
  return res.json()
}

/**
 * Valida y guarda credenciales SMTP en caliente en el servidor
 */
export async function configureSmtp(payload: {
  user: string
  pass: string
  host?: string
  port?: number
  secure?: boolean
  from?: string
}): Promise<{ message: string; user: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'
  const res = await fetch(`${backendUrl}/api/v1/reminders/smtp-configure`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
    },
    body: JSON.stringify(payload),
  })
  const body = await res.json()
  if (!res.ok) {
    throw new Error(body.error || 'Error al conectar con el servidor SMTP')
  }
  return body
}


