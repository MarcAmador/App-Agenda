import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  getUserPreferences,
  updateUserPreferences,
  getReminderLogs,
  sendTestNotification,
} from '@/services/preferences.service'
import type { UpdateUserPreferencesInput, NotificationChannel } from '@/types/database.types'

export const preferenceKeys = {
  all: ['preferences'] as const,
  current: () => [...preferenceKeys.all, 'current'] as const,
  logs: () => [...preferenceKeys.all, 'logs'] as const,
}

/** Hook para obtener las preferencias del usuario */
export function useUserPreferences() {
  return useQuery({
    queryKey: preferenceKeys.current(),
    queryFn: getUserPreferences,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

/** Hook para actualizar las preferencias */
export function useUpdatePreferences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateUserPreferencesInput) => updateUserPreferences(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: preferenceKeys.current() })
      toast.success('Preferencias guardadas correctamente')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al guardar las preferencias')
    },
  })
}

/** Hook para obtener el registro de auditoría de notificaciones */
export function useReminderLogs() {
  return useQuery({
    queryKey: preferenceKeys.logs(),
    queryFn: () => getReminderLogs(25),
    staleTime: 1000 * 30, // 30 segundos
  })
}

/** Hook para enviar notificación de prueba */
export function useSendTestNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      channel,
      destination,
    }: {
      channel: NotificationChannel
      destination?: string
    }) => sendTestNotification(channel, destination),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: preferenceKeys.logs() })
      toast.success(data.message)
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al enviar la notificación de prueba')
    },
  })
}
