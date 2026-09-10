import { Router } from 'express'
import type { Request, Response } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { supabaseAdmin } from '../config/supabase'
import { AdminService } from '../services/admin.service'

export const authRouter = Router()

/**
 * Función auxiliar para parsear un User-Agent a un formato amigable para humanos
 */
function parseDeviceSignature(userAgent: string): string {
  let browser = 'Navegador Web'
  let os = 'Dispositivo'

  if (/chrome|crios/i.test(userAgent) && !/edg|opr/i.test(userAgent)) {
    browser = 'Google Chrome'
  } else if (/firefox|fxios/i.test(userAgent)) {
    browser = 'Mozilla Firefox'
  } else if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent)) {
    browser = 'Apple Safari'
  } else if (/edg/i.test(userAgent)) {
    browser = 'Microsoft Edge'
  } else if (/opr|opera/i.test(userAgent)) {
    browser = 'Opera'
  }

  if (/windows/i.test(userAgent)) {
    os = 'Windows'
  } else if (/macintosh|mac os x/i.test(userAgent)) {
    os = 'macOS'
  } else if (/android/i.test(userAgent)) {
    os = 'Android'
  } else if (/iphone|ipad|ipod/i.test(userAgent)) {
    os = 'iOS'
  } else if (/linux/i.test(userAgent)) {
    os = 'Linux'
  }

  return `${browser} en ${os}`
}

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

/**
 * POST /api/v1/auth/forgot-password
 * Permite solicitar el restablecimiento de contraseña EXCLUSIVAMENTE para cuentas registradas con correo.
 * Si el usuario se registró con Google OAuth, rechaza la solicitud e indica iniciar sesión con Google.
 */
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    if (!email || typeof email !== 'string' || !email.trim()) {
      res.status(400).json({ error: 'El correo electrónico es obligatorio.' })
      return
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Buscar el usuario en Supabase Auth
    const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })

    if (listErr) {
      console.error('[forgot-password] Error listando usuarios:', listErr)
      res.status(500).json({ error: 'Error al verificar la cuenta.' })
      return
    }

    const user = usersData.users.find(
      (u) => u.email && u.email.toLowerCase() === normalizedEmail
    )

    if (!user) {
      // Por seguridad informativa clara requerida por el usuario
      res.status(404).json({
        error: 'No se encontró ninguna cuenta registrada con este correo electrónico.',
      })
      return
    }

    // Verificar proveedor de autenticación
    const isGoogleAccount =
      user.app_metadata?.provider === 'google' ||
      (user.identities &&
        user.identities.length > 0 &&
        user.identities.every((id) => id.provider === 'google'))

    if (isGoogleAccount) {
      res.status(400).json({
        error:
          'Esta cuenta fue registrada mediante Google OAuth institucional. No utiliza contraseña tradicional; por favor inicia sesión utilizando el botón "Continuar con Google Institucional".',
        isOAuth: true,
      })
      return
    }

    // Generar enlace seguro de recuperación
    const appUrl = (process.env.FRONTEND_URL || 'http://localhost:5180').replace(/\/$/, '')
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: user.email!,
      options: {
        redirectTo: `${appUrl}/auth/callback`,
      },
    })

    if (linkErr || !linkData.properties?.action_link) {
      console.error('[forgot-password] Error generando link de recuperación:', linkErr)
      res.status(500).json({ error: 'No se pudo generar el enlace de recuperación.' })
      return
    }

    // Enviar correo con la plantilla 'recuperacion_password'
    const recipientName = user.user_metadata?.full_name || user.email!.split('@')[0]
    await AdminService.sendSystemEmail('recuperacion_password', user.email!, {
      name: recipientName,
      action_url: linkData.properties.action_link,
      app_name: 'AgendaPro',
    })

    // Registrar en auditoría
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email!,
      actor_name: recipientName,
      action: 'PASSWORD_RECOVERY_REQUESTED',
      resource_type: 'auth_account',
      resource_id: user.id,
      ip_address: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1',
      user_agent: req.headers['user-agent'] || 'AgendaPro Web',
      status: 'success',
      details: { email: user.email },
    })

    res.json({
      success: true,
      message: 'Te hemos enviado un correo seguro con el enlace para restablecer tu contraseña.',
    })
  } catch (err: any) {
    console.error('[forgot-password] Error inesperado:', err)
    res.status(500).json({ error: err.message || 'Error interno del servidor.' })
  }
})

/**
 * POST /api/v1/auth/record-login
 * Registra los dispositivos en los cuales los usuarios inician sesión.
 * Si se detecta un nuevo dispositivo/navegador, envía el correo de alerta con la plantilla 'nuevo_dispositivo'.
 */
authRouter.post('/record-login', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const rawUserAgent = req.headers['user-agent'] || 'Navegador Desconocido'
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1'

    const deviceSignature = parseDeviceSignature(rawUserAgent)

    // Obtener datos del usuario
    const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (userErr || !userData.user) {
      res.status(404).json({ error: 'Usuario no encontrado' })
      return
    }

    const user = userData.user
    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Docente'

    // Consultar inicios de sesión previos del usuario en audit_logs
    const { data: previousLogins } = await supabaseAdmin
      .from('audit_logs')
      .select('id, user_agent, resource_id, ip_address, created_at')
      .eq('actor_id', userId)
      .in('action', ['LOGIN', 'NEW_DEVICE_LOGIN'])
      .limit(100)

    // Determinar si este dispositivo ya ha sido visto previamente
    const knownMatch = previousLogins?.find((log) => {
      const matchDevice = log.resource_id === deviceSignature || log.user_agent === rawUserAgent
      return matchDevice
    })

    const isNewDevice = !knownMatch

    if (isNewDevice) {
      // Registrar en audit_logs como nuevo dispositivo
      await supabaseAdmin.from('audit_logs').insert({
        actor_id: userId,
        actor_email: user.email!,
        actor_name: userName,
        action: 'NEW_DEVICE_LOGIN',
        resource_type: 'auth_device',
        resource_id: deviceSignature,
        ip_address: ip,
        user_agent: rawUserAgent,
        status: 'warning',
        details: {
          is_new_device: true,
          device_signature: deviceSignature,
          login_time: new Date().toISOString(),
        },
      })

      // Enviar correo de alerta de seguridad: plantilla 'nuevo_dispositivo'
      const appUrl = (process.env.FRONTEND_URL || 'http://localhost:5180').replace(/\/$/, '')
      const loginTimeFormatted = new Intl.DateTimeFormat('es-GT', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'America/Guatemala',
      }).format(new Date())

      try {
        await AdminService.sendSystemEmail('nuevo_dispositivo', user.email!, {
          name: userName,
          ip_address: ip,
          login_time: loginTimeFormatted,
          user_agent: deviceSignature,
          action_url: `${appUrl}/config`,
          app_name: 'AgendaPro',
        })
      } catch (mailErr) {
        console.warn('[record-login] Advertencia al enviar correo de nuevo dispositivo:', mailErr)
      }

      res.json({
        recorded: true,
        isNewDevice: true,
        device: deviceSignature,
      })
    } else {
      // Registro normal de sesión recurrente
      await supabaseAdmin.from('audit_logs').insert({
        actor_id: userId,
        actor_email: user.email!,
        actor_name: userName,
        action: 'LOGIN',
        resource_type: 'auth_device',
        resource_id: deviceSignature,
        ip_address: ip,
        user_agent: rawUserAgent,
        status: 'success',
        details: {
          is_new_device: false,
          device_signature: deviceSignature,
          login_time: new Date().toISOString(),
        },
      })

      res.json({
        recorded: true,
        isNewDevice: false,
        device: deviceSignature,
      })
    }
  } catch (err: any) {
    console.error('[record-login] Error:', err)
    res.status(500).json({ error: 'Error al registrar el dispositivo.' })
  }
})
