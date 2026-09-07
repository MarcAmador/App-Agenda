import type { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../config/supabase'

/**
 * Extiende el objeto Request de Express para incluir el usuario autenticado.
 */
declare global {
  namespace Express {
    interface Request {
      userId?: string
      userEmail?: string
    }
  }
}

/**
 * Middleware de autenticación JWT de Supabase.
 * Extrae el Bearer token del header Authorization, lo valida contra Supabase Auth
 * y adjunta el userId al request para las rutas protegidas.
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'No autorizado',
      message: 'Se requiere un token de autenticación Bearer.',
    })
    return
  }

  const token = authHeader.substring(7)

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    res.status(401).json({
      error: 'Token inválido',
      message: 'La sesión ha expirado o el token no es válido. Inicia sesión nuevamente.',
    })
    return
  }

  req.userId = user.id
  req.userEmail = user.email
  next()
}
