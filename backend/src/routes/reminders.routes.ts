import { Router } from 'express'
import type { Request, Response } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { supabaseAdmin } from '../config/supabase'
import { SendTestNotificationSchema } from '../schemas/preferences.schemas'
import { notificationDispatcher } from '../services/dispatcher/notification.dispatcher'

export const remindersRouter = Router()

remindersRouter.use(authMiddleware)

/**
 * GET /api/v1/reminders/logs
 * Obtiene el historial de notificaciones y recordatorios del usuario.
 */
remindersRouter.get('/logs', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)

    const { data: logs, error } = await supabaseAdmin
      .from('reminder_logs')
      .select('*, tasks(title, due_date, priority)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    res.json({ data: logs ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al obtener el registro de recordatorios'
    res.status(500).json({ error: message })
  }
})

/**
 * POST /api/v1/reminders/test
 * Envía una notificación de prueba al canal solicitado.
 */
remindersRouter.post('/test', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { channel, destination } = SendTestNotificationSchema.parse(req.body)

    const result = await notificationDispatcher.sendTestNotification(userId, channel, destination)

    if (!result.success) {
      return res.status(422).json({
        error: result.error ?? 'Fallo en la entrega de la notificación de prueba',
        result,
      })
    }

    res.json({
      message: `Notificación de prueba enviada exitosamente por ${channel}`,
      result,
    })
  } catch (err) {
    if (err && typeof err === 'object' && 'issues' in err) {
      return res.status(400).json({ error: 'Datos de prueba inválidos', details: err })
    }
    const message = err instanceof Error ? err.message : 'Error al enviar notificación de prueba'
    res.status(500).json({ error: message })
  }
})

/**
 * POST /api/v1/reminders/dispatch
 * Ejecuta el proceso de despacho de recordatorios para tareas pendientes.
 */
remindersRouter.post('/dispatch', async (_req: Request, res: Response) => {
  try {
    const stats = await notificationDispatcher.dispatchUpcomingReminders()
    res.json({
      message: 'Proceso de recordatorios ejecutado correctamente',
      stats,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al ejecutar el despachador de recordatorios'
    res.status(500).json({ error: message })
  }
})
