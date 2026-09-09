import { supabaseAdmin } from '../../config/supabase'
import type {
  ChannelAdapter,
  DeliveryResult,
  NotificationChannel,
  NotificationPayload,
} from './dispatcher.types'
import { EmailAdapter } from './adapters/email.adapter'
import { WhatsAppAdapter } from './adapters/whatsapp.adapter'
import { TelegramAdapter } from './adapters/telegram.adapter'
import { decodeLeadTimes } from '../../utils/leadTimes'

/**
 * Obtiene la fecha YYYY-MM-DD actual en la zona horaria institucional
 */
function getTodayInTimezone(timeZone = 'America/Guatemala'): string {
  try {
    const dtf = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    return dtf.format(new Date())
  } catch {
    return new Date().toISOString().split('T')[0]
  }
}

/**
 * Convierte una fecha y hora local (ej: '2026-09-09', '14:30:00') en una zona horaria IANA
 * a milisegundos Unix en tiempo UTC.
 */
function parseZonedDateTime(
  dateStr: string,
  timeStr?: string | null,
  timeZone = 'America/Guatemala'
): number {
  const tStr = timeStr ? timeStr.substring(0, 8) : '23:59:59'
  try {
    const dummyUtc = new Date(`${dateStr}T${tStr}Z`)
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    const parts = dtf.formatToParts(dummyUtc)
    const p: Record<string, string> = {}
    parts.forEach(({ type, value }) => {
      p[type] = value
    })
    let h = parseInt(p.hour, 10)
    if (h === 24) h = 0
    const localIsoStr = `${p.year}-${p.month}-${p.day}T${String(h).padStart(2, '0')}:${p.minute}:${p.second}Z`
    const offsetMs = dummyUtc.getTime() - new Date(localIsoStr).getTime()
    return dummyUtc.getTime() + offsetMs
  } catch {
    // Fallback: America/Guatemala es UTC-6 todo el año
    const [y, m, d] = dateStr.split('-').map(Number)
    const [h, min, s] = tStr.split(':').map(Number)
    return Date.UTC(y, m - 1, d, (h ?? 0) + 6, min ?? 0, s ?? 0)
  }
}

export class NotificationDispatcher {
  private adapters: Map<NotificationChannel, ChannelAdapter>

  constructor() {
    this.adapters = new Map<NotificationChannel, ChannelAdapter>([
      ['email', new EmailAdapter()],
      ['whatsapp', new WhatsAppAdapter()],
      ['telegram', new TelegramAdapter()],
    ])
  }

  /**
   * Envía una notificación de prueba inmediata a un canal específico
   */
  async sendTestNotification(
    userId: string,
    channel: NotificationChannel,
    destination?: string
  ): Promise<DeliveryResult> {
    // 1. Obtener datos del usuario desde auth.users y user_preferences
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (userError || !userData?.user) {
      throw new Error(`Usuario no encontrado: ${userError?.message ?? 'ID inválido'}`)
    }

    const { data: prefs } = await supabaseAdmin
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    const adapter = this.adapters.get(channel)
    if (!adapter) {
      throw new Error(`Canal no soportado: ${channel}`)
    }

    const payload: NotificationPayload = {
      taskTitle: 'Tarea de demostración AgendaPro',
      taskDescription: 'Revisión y validación de recordatorios multicanal para coordinadores.',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '18:00:00',
      priority: 'Urgente e Importante',
      userName: (userData.user.user_metadata?.full_name as string) ?? userData.user.email?.split('@')[0] ?? 'Coordinador',
      userEmail: (channel === 'email' && destination?.trim()) ? destination.trim() : (userData.user.email || 'notificaciones@agendapro.edu'),
      phoneNumber: destination ?? prefs?.phone_number ?? null,
      telegramChatId: destination ?? prefs?.telegram_chat_id ?? null,
      isTest: true,
      leadMinutes: 15,
    }

    const result = await adapter.send(payload)
    return result
  }

  /**
   * Resetea el adaptador de correo cuando se actualizan credenciales SMTP
   */
  public resetEmailAdapter(): void {
    const emailAdapter = this.adapters.get('email')
    if (emailAdapter && emailAdapter instanceof EmailAdapter) {
      emailAdapter.resetTransporter()
    }
  }

  /**
   * Motor de despacho: escanea tareas próximas al vencimiento y envía los recordatorios
   * en cada uno de los tiempos de anticipación configurados por el usuario.
   */
  async dispatchUpcomingReminders(): Promise<{ processed: number; sent: number; failed: number }> {
    const now = new Date()
    const nowMs = now.getTime()

    // 1. Formatear la fecha local de hoy en la zona horaria institucional (Guatemala UTC-6)
    const localToday = getTodayInTimezone('America/Guatemala')

    // Consultar tareas activas (hoy en adelante, o sin due_date asignado explícito)
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .in('status', ['pendiente', 'en_curso'])
      .is('deleted_at', null)
      .or(`due_date.gte.${localToday},due_date.is.null`)
      .order('due_date', { ascending: true })
      .limit(100)

    if (tasksError) {
      throw new Error(`Error al consultar tareas para recordatorios: ${tasksError.message}`)
    }

    let processed = 0
    let sent = 0
    let failed = 0

    // Cache local de preferencias y usuarios por ciclo para optimizar consultas
    const prefsCache = new Map<string, any>()
    const usersCache = new Map<string, any>()

    for (const task of tasks ?? []) {
      // Regla 1: Estado estrictamente activo (ignora completadas, anuladas, archivadas, eliminadas)
      if (!task || task.deleted_at !== null) continue
      if (task.status !== 'pendiente' && task.status !== 'en_curso') continue

      // Si due_date es null, inferir fecha de creación o el día de hoy
      const effectiveDueDate = task.due_date || (task.created_at ? task.created_at.split('T')[0] : localToday)

      // Regla 2: Calcular el momento exacto de vencimiento en la zona horaria institucional
      const dueMs = parseZonedDateTime(effectiveDueDate, task.due_time, 'America/Guatemala')

      // Regla 3: TAREAS VENCIDAS
      // Si la fecha y hora de vencimiento ya pasaron, NUNCA enviar avisos de anticipación
      if (nowMs >= dueMs) {
        continue
      }

      // Obtener preferencias del usuario
      let prefs = prefsCache.get(task.user_id)
      if (!prefs) {
        const { data: userPrefs } = await supabaseAdmin
          .from('user_preferences')
          .select('*')
          .eq('user_id', task.user_id)
          .single()
        prefs = userPrefs
        if (prefs) prefsCache.set(task.user_id, prefs)
      }

      if (!prefs || !prefs.notification_channels || prefs.notification_channels.length === 0) {
        continue
      }

      // Obtener datos de usuario
      let userData = usersCache.get(task.user_id)
      if (!userData) {
        const { data: uData } = await supabaseAdmin.auth.admin.getUserById(task.user_id)
        userData = uData?.user
        if (userData) usersCache.set(task.user_id, userData)
      }

      if (!userData) continue

      // Regla 4: CAMBIOS VIGENTES HACIA ADELANTE
      // Los cambios de horario o creación de tareas rigen estrictamente desde el instante en que ocurrieron
      const taskCreatedAtMs = new Date(task.created_at).getTime()
      const prefsUpdatedAtMs = prefs.updated_at
        ? new Date(prefs.updated_at).getTime()
        : new Date(prefs.created_at || nowMs).getTime()

      // El hito de notificación no debe ser anterior al momento de creación o cambio
      const activeSinceMs = Math.max(taskCreatedAtMs, prefsUpdatedAtMs)

      // Decodificar todos los tiempos de anticipación elegidos por el usuario (ej: [3, 5, 10, 15])
      const leadTimes = decodeLeadTimes(prefs.reminder_lead_time_minutes)
      const channels: NotificationChannel[] = prefs.notification_channels

      for (const leadMin of leadTimes) {
        const triggerMs = dueMs - (leadMin * 60 * 1000)

        // 4a: Si el momento de disparo ya había pasado antes de que se guardara la configuración o se creara la tarea, OMITIR
        if (triggerMs < activeSinceMs - 60000) {
          continue
        }

        // 4b: ¿Ya llegó el momento de disparar esta alerta en tiempo real?
        if (nowMs < triggerMs) {
          // Aún falta tiempo para este hito específico
          continue
        }

        // 4c: Ventana de captura en tiempo real: máximo 3 minutos de desfase para no enviar avisos extemporáneos
        const maxDispatchLagMs = 3 * 60 * 1000
        if (nowMs - triggerMs > maxDispatchLagMs) {
          continue
        }

        const scheduledIso = new Date(triggerMs).toISOString()

        for (const ch of channels) {
          // Verificar si ya se envió el recordatorio para este hito exacto
          const { data: existingLog } = await supabaseAdmin
            .from('reminder_logs')
            .select('id')
            .eq('task_id', task.id)
            .eq('channel', ch)
            .eq('scheduled_for', scheduledIso)
            .eq('status', 'sent')
            .maybeSingle()

          if (existingLog) {
            // Ya fue notificado previamente para este tiempo
            continue
          }

          processed++
          const adapter = this.adapters.get(ch)
          if (!adapter) continue

          const payload: NotificationPayload = {
            taskId: task.id,
            taskTitle: task.title,
            taskDescription: task.description,
            dueDate: task.due_date,
            dueTime: task.due_time,
            priority: task.priority,
            scopePeriod: task.scope_period,
            userName: (userData.user_metadata?.full_name as string) ?? userData.email?.split('@')[0] ?? 'Coordinador',
            userEmail: userData.email,
            phoneNumber: prefs.phone_number,
            telegramChatId: prefs.telegram_chat_id,
            leadMinutes: leadMin,
          }

          console.log(`[NotificationDispatcher] 🚀 Enviando alerta (${leadMin} min antes) para "${task.title}" vía ${ch} a ${userData.email}...`)
          const delivery = await adapter.send(payload)

          // Registrar en reminder_logs
          await supabaseAdmin.from('reminder_logs').insert({
            task_id: task.id,
            user_id: task.user_id,
            channel: ch,
            status: delivery.success ? 'sent' : 'failed',
            scheduled_for: scheduledIso,
            sent_at: delivery.success ? delivery.sentAt.toISOString() : null,
            error_message: delivery.error ?? null,
          })

          if (delivery.success) {
            sent++
            console.log(`[NotificationDispatcher] ✅ Alerta (${leadMin} min antes) despachada exitosamente para "${task.title}".`)
          } else {
            failed++
            console.warn(`[NotificationDispatcher] ⚠️ Fallo al despachar alerta para "${task.title}": ${delivery.error}`)
          }
        }
      }
    }

    return { processed, sent, failed }
  }
}

export const notificationDispatcher = new NotificationDispatcher()
