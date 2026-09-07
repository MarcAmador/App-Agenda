import { Router } from 'express'
import type { Request, Response } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { supabaseAdmin } from '../config/supabase'

export const authRouter = Router()

/**
 * GET /api/v1/auth/me
 * Retorna el perfil del usuario autenticado junto con sus preferencias.
 */
authRouter.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!

    const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (error || !user) {
      res.status(404).json({ error: 'Usuario no encontrado' })
      return
    }

    // Recuperar preferencias del usuario
    const { data: preferences } = await supabaseAdmin
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    res.json({
      user: {
        id: user.user.id,
        email: user.user.email,
        name: user.user.user_metadata?.full_name,
        avatarUrl: user.user.user_metadata?.avatar_url,
        createdAt: user.user.created_at,
      },
      preferences: preferences ?? null,
    })
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener el perfil del usuario' })
  }
})
