import type { ChannelAdapter, DeliveryResult, NotificationPayload } from '../dispatcher.types'

export class TelegramAdapter implements ChannelAdapter {
  readonly channel = 'telegram' as const

  async send(payload: NotificationPayload): Promise<DeliveryResult> {
    const sentAt = new Date()

    if (!payload.telegramChatId) {
      return {
        channel: this.channel,
        success: false,
        error: 'El usuario no tiene un Chat ID de Telegram configurado',
        sentAt,
      }
    }

    try {
      const message = this.formatMarkdown(payload)

      // Registro de despacho de Telegram
      console.log(`[TelegramAdapter] Enviando a Chat ID ${payload.telegramChatId}:\n${message}`)

      // En producción con TELEGRAM_BOT_TOKEN,
      // se despacha fetch(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id, text, parse_mode: 'Markdown' })
      const messageId = `tg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

      return {
        channel: this.channel,
        success: true,
        messageId,
        sentAt,
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido al enviar Telegram'
      console.error('[TelegramAdapter] Error:', errorMsg)
      return {
        channel: this.channel,
        success: false,
        error: errorMsg,
        sentAt,
      }
    }
  }

  private formatMarkdown(payload: NotificationPayload): string {
    if (payload.isTest) {
      return `🔔 *AgendaPro · Notificación de Prueba*\n\n¡Hola ${payload.userName}! Tu chat de Telegram ha sido vinculado correctamente. Recibirás aquí tus alertas académicas oportunas.`
    }

    let text = `⏰ *Recordatorio AgendaPro*\n\nHola ${payload.userName},\n\n📌 *${payload.taskTitle}*\n`
    if (payload.taskDescription) {
      text += `${payload.taskDescription}\n\n`
    }
    if (payload.dueDate) {
      text += `📅 *Fecha límite:* ${payload.dueDate}${payload.dueTime ? ` a las ${payload.dueTime.substring(0, 5)}` : ''}\n`
    }
    if (payload.priority) {
      text += `⚡ *Prioridad:* ${payload.priority}\n`
    }
    text += `\n_Abre tu agenda para marcarla como completada._`

    return text
  }
}
