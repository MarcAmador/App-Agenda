import type { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../config/supabase'

export const SUPER_ADMIN_EMAILS = [
  'ronaldo22amador@gmail.com',
  'marlon21ronaldo@gmail.com',
]

declare global {
  namespace Express {
    interface Request {
      userId?: string
      userEmail?: string
      userRole?: 'super_admin' | 'admin' | 'support' | 'user'
      isSuperAdmin?: boolean
    }
  }
}

/**
 * Middleware para proteger rutas de administración.
 * Requiere que el usuario esté previamente autenticado con authMiddleware.
 * Verifica si el usuario tiene rol 'super_admin' o 'admin' en public.user_roles,
 * o si su correo coincide con la lista maestra de propietarios.
 */
export async function requireAdminRole(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const userId = req.userId
  const userEmail = req.userEmail?.toLowerCase()

  if (!userId || !userEmail) {
    res.status(401).json({
      error: 'No autenticado',
      message: 'Debes iniciar sesión para acceder al panel administrativo.',
    })
    return
  }

  // 1. Acceso maestro inmediato para los correos del propietario
  if (SUPER_ADMIN_EMAILS.includes(userEmail)) {
    req.userRole = 'super_admin'
    req.isSuperAdmin = true
    return next()
  }

  // 2. Consulta de rol en la base de datos
  try {
    const { data: roleData, error } = await supabaseAdmin
      .from('user_roles')
      .select('role, status')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.warn('[requireAdminRole] Error consultando user_roles:', error.message)
    }

    if (roleData) {
      if (roleData.status === 'suspended') {
        res.status(403).json({
          error: 'Cuenta suspendida',
          message: 'Tu cuenta administrativa ha sido suspendida. Contacta al propietario.',
        })
        return
      }

      if (roleData.role === 'super_admin' || roleData.role === 'admin') {
        req.userRole = roleData.role
        req.isSuperAdmin = roleData.role === 'super_admin'
        return next()
      }
    }

    // 3. Denegar acceso si no cuenta con privilegios
    res.status(403).json({
      error: 'Acceso denegado',
      message: 'Se requieren privilegios de Administrador para acceder a esta sección.',
    })
  } catch (err) {
    console.error('[requireAdminRole] Excepción no controlada:', err)
    res.status(500).json({
      error: 'Error de servidor',
      message: 'No fue posible validar tus credenciales administrativas.',
    })
  }
}
