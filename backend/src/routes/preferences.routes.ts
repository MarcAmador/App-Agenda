import { Router } from 'express'
import type { Request, Response } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { supabaseAdmin } from '../config/supabase'
import { UpdateUserPreferencesSchema } from '../schemas/preferences.schemas'

export const preferencesRouter = Router()

preferencesRouter.use(authMiddleware)

/**
 * GET /api/v1/preferences
 * Obtiene las preferencias del usuario autenticado (o crea defaults si no existen).
 */
preferencesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!

    const { data: prefs, error } = await supabaseAdmin
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error

    if (!prefs) {
      // Crear preferencias por defecto si no existen
      const defaultPrefs = {
        user_id: userId,
        notification_channels: ['email'],
        phone_number: null,
        telegram_chat_id: null,
        reminder_lead_time_minutes: 60,
        theme: 'system',
      }

      const { data: created, error: insertError } = await supabaseAdmin
        .from('user_preferences')
        .insert(defaultPrefs)
        .select()
        .single()

      if (insertError) throw insertError
      return res.json({ data: created })
    }

    res.json({ data: prefs })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al obtener preferencias'
    res.status(500).json({ error: message })
  }
})

/**
 * PUT /api/v1/preferences
 * Actualiza las preferencias del usuario autenticado con validación Zod.
 */
preferencesRouter.put('/', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const validatedInput = UpdateUserPreferencesSchema.parse(req.body)

    const { data: updated, error } = await supabaseAdmin
      .from('user_preferences')
      .update(validatedInput)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    res.json({
      message: 'Preferencias actualizadas correctamente',
      data: updated,
    })
  } catch (err) {
    if (err && typeof err === 'object' && 'issues' in err) {
      return res.status(400).json({ error: 'Datos de preferencias inválidos', details: err })
    }
    const message = err instanceof Error ? err.message : 'Error al actualizar preferencias'
    res.status(500).json({ error: message })
  }
})
