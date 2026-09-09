import { z } from 'zod'

export const NotificationChannelEnum = z.enum(['email', 'whatsapp', 'telegram'])
export const ThemeEnum = z.enum(['light', 'dark', 'system'])

/**
 * Esquema de validación para actualizar preferencias de usuario
 */
export const UpdateUserPreferencesSchema = z.object({
  notification_channels: z
    .array(NotificationChannelEnum)
    .min(1, { message: 'Debes seleccionar al menos un canal de notificación' })
    .optional(),
  phone_number: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/, {
      message: 'Formato de teléfono inválido. Usa el estándar internacional, ej: +50212345678',
    })
    .nullable()
    .optional(),
  telegram_chat_id: z
    .string()
    .max(50, { message: 'El ID de chat de Telegram no puede exceder 50 caracteres' })
    .nullable()
    .optional(),
  reminder_lead_time_minutes: z
    .number({ invalid_type_error: 'El tiempo de anticipación debe ser un número' })
    .int()
    .min(1, { message: 'El tiempo mínimo de anticipación es de 1 minuto' })
    .max(200000, { message: 'El tiempo de anticipación o combinación es inválido' })
    .optional(),
  theme: ThemeEnum.optional(),
})

export type UpdateUserPreferencesInput = z.infer<typeof UpdateUserPreferencesSchema>

/**
 * Esquema para enviar una notificación de prueba
 */
export const SendTestNotificationSchema = z.object({
  channel: NotificationChannelEnum,
  destination: z.string().optional(),
})

export type SendTestNotificationInput = z.infer<typeof SendTestNotificationSchema>
