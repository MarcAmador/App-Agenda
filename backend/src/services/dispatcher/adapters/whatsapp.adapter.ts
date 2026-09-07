import { env } from '../../../config/env'
import type { ChannelAdapter, DeliveryResult, NotificationPayload } from '../dispatcher.types'

export class WhatsAppAdapter implements ChannelAdapter {
  readonly channel = 'whatsapp' as const

  async send(payload: NotificationPayload): Promise<DeliveryResult> {
    const sentAt = new Date()

    if (!payload.phoneNumber) {
      return {
        channel: this.channel,
        success: false,
        error: 'El usuario no tiene un número de teléfono configurado para WhatsApp',
        sentAt,
      }
    }

    // Limpiar el número de teléfono: solo dígitos y signo +
    const cleanPhone = payload.phoneNumber.replace(/[^\d+]/g, '').replace(/^\+/, '')
    const message = this.formatMessage(payload)
    const directUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`

    try {
      // 1. Envío vía Twilio WhatsApp API (si está configurado en .env)
      if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_WHATSAPP_NUMBER) {
        return await this.sendViaTwilio(cleanPhone, message, directUrl, sentAt)
      }

      // 2. Envío vía Meta Cloud API (si está configurado en .env)
      if (env.WHATSAPP_API_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID) {
        return await this.sendViaMetaApi(cleanPhone, message, directUrl, sentAt)
      }

      // 3. Envío directo habilitado (wa.me)
      console.log(`[WhatsAppAdapter] 📱 URL directa generada para ${cleanPhone}:\n${directUrl}`)

      return {
        channel: this.channel,
        success: true,
        messageId: `wa_direct_${Date.now()}`,
        directUrl,
        sentAt,
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido al procesar WhatsApp'
      console.error('[WhatsAppAdapter] Error:', errorMsg)
      return {
        channel: this.channel,
        success: false,
        error: errorMsg,
        directUrl,
        sentAt,
      }
    }
  }

  private async sendViaTwilio(
    toPhone: string,
    message: string,
    directUrl: string,
    sentAt: Date
  ): Promise<DeliveryResult> {
    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`
    const authHeader = 'Basic ' + Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64')

    const formData = new URLSearchParams()
    formData.append('From', env.TWILIO_WHATSAPP_NUMBER!)
    formData.append('To', `whatsapp:+${toPhone}`)
    formData.append('Body', message)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await response.json()) as any

    if (!response.ok) {
      throw new Error(data.message || 'Error en la API de Twilio WhatsApp')
    }

    console.log(`[WhatsAppAdapter] ✅ Despachado por Twilio WhatsApp: ${data.sid}`)
    return {
      channel: this.channel,
      success: true,
      messageId: data.sid,
      directUrl,
      sentAt,
    }
  }

  private async sendViaMetaApi(
    toPhone: string,
    message: string,
    directUrl: string,
    sentAt: Date
  ): Promise<DeliveryResult> {
    const endpoint = `https://graph.facebook.com/v18.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: toPhone,
        type: 'text',
        text: { body: message },
      }),
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await response.json()) as any

    if (!response.ok) {
      throw new Error(data.error?.message || 'Error en la Meta Cloud API de WhatsApp')
    }

    console.log(`[WhatsAppAdapter] ✅ Despachado por Meta Cloud API: ${data.messages?.[0]?.id}`)
    return {
      channel: this.channel,
      success: true,
      messageId: data.messages?.[0]?.id,
      directUrl,
      sentAt,
    }
  }


  private formatMessage(payload: NotificationPayload): string {
    if (payload.isTest) {
      return `🔔 *AgendaPro · Notificación de Prueba*\n\n¡Hola ${payload.userName}! Tu número ha sido verificado con éxito para recibir alertas y recordatorios de actividades académicas.\n\n_AgendaPro SaaS · Productividad Docente_`
    }

    let text = `⏰ *Recordatorio AgendaPro*\n\nHola ${payload.userName},\n\n📌 *Actividad:* ${payload.taskTitle}\n`
    if (payload.taskDescription) {
      text += `📝 *Detalles:* ${payload.taskDescription}\n`
    }
    if (payload.dueDate) {
      text += `📅 *Fecha límite:* ${payload.dueDate}${payload.dueTime ? ` a las ${payload.dueTime.substring(0, 5)}` : ''}\n`
    }
    if (payload.priority) {
      text += `⚡ *Prioridad:* ${payload.priority}\n`
    }
    const appUrl = env.CORS_ORIGIN || 'http://localhost:5180'
    text += `\n🔗 *Gestionar tarea:* ${appUrl}/tareas`

    return text
  }
}
