export type NotificationChannel = 'email' | 'whatsapp' | 'telegram'
export type NotificationStatus = 'pending' | 'sent' | 'failed'

export interface NotificationPayload {
  taskId?: string
  taskTitle: string
  taskDescription?: string | null
  dueDate?: string | null
  dueTime?: string | null
  priority?: string
  scopePeriod?: string
  userName: string
  userEmail?: string
  phoneNumber?: string | null
  telegramChatId?: string | null
  isTest?: boolean
  leadMinutes?: number
}

export interface DeliveryResult {
  channel: NotificationChannel
  success: boolean
  messageId?: string
  error?: string
  sentAt: Date
  previewUrl?: string // URL de previsualización web (ej. Ethereal Email)
  directUrl?: string  // URL directa de envío (ej. wa.me para WhatsApp)
}


export interface ChannelAdapter {
  readonly channel: NotificationChannel
  send(payload: NotificationPayload): Promise<DeliveryResult>
}
