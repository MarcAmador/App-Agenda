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
      userEmail: userData.user.email,
      phoneNumber: destination ?? prefs?.phone_number ?? null,
      telegramChatId: destination ?? prefs?.telegram_chat_id ?? null,
      isTest: true,
    }

    const result = await adapter.send(payload)

    // Opcional: registrar en reminder_logs si existe una tarea o simular log
    return result
  }

  /**
   * Motor de despacho: escanea tareas próximas al vencimiento y envía los recordatorios
   */
  async dispatchUpcomingReminders(): Promise<{ processed: number; sent: number; failed: number }> {
    const today = new Date().toISOString().split('T')[0]

    // 1. Obtener tareas pendientes o en curso con fecha límite asignada
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .in('status', ['pendiente', 'en_curso'])
      .is('deleted_at', null)
      .gte('due_date', today)
      .order('due_date', { ascending: true })
      .limit(50)

    if (tasksError) {
      throw new Error(`Error al consultar tareas para recordatorios: ${tasksError.message}`)
    }

    let processed = 0
    let sent = 0
    let failed = 0

    for (const task of tasks ?? []) {
      // 2. Obtener preferencias del dueño de la tarea
      const { data: prefs } = await supabaseAdmin
        .from('user_preferences')
        .select('*')
        .eq('user_id', task.user_id)
        .single()

      if (!prefs || !prefs.notification_channels || prefs.notification_channels.length === 0) {
        continue
      }

      // Obtener datos del usuario
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(task.user_id)
      if (!userData?.user) continue

      const channels: NotificationChannel[] = prefs.notification_channels

      for (const ch of channels) {
        // Verificar si ya se envió un recordatorio exitoso para esta tarea en este canal
        const { data: existingLog } = await supabaseAdmin
          .from('reminder_logs')
          .select('id')
          .eq('task_id', task.id)
          .eq('channel', ch)
          .eq('status', 'sent')
          .maybeSingle()

        if (existingLog) {
          // Ya fue notificado previamente
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
          userName: (userData.user.user_metadata?.full_name as string) ?? 'Coordinador',
          userEmail: userData.user.email,
          phoneNumber: prefs.phone_number,
          telegramChatId: prefs.telegram_chat_id,
        }

        const delivery = await adapter.send(payload)

        // Registrar en reminder_logs
        await supabaseAdmin.from('reminder_logs').insert({
          task_id: task.id,
          user_id: task.user_id,
          channel: ch,
          status: delivery.success ? 'sent' : 'failed',
          scheduled_for: new Date().toISOString(),
          sent_at: delivery.success ? delivery.sentAt.toISOString() : null,
          error_message: delivery.error ?? null,
        })

        if (delivery.success) {
          sent++
        } else {
          failed++
        }
      }
    }

    return { processed, sent, failed }
  }
}

export const notificationDispatcher = new NotificationDispatcher()
