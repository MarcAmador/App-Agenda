import { Router } from 'express'
import type { Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import nodemailer from 'nodemailer'
import { env } from '../config/env'
import { authMiddleware } from '../middlewares/auth.middleware'
import { supabaseAdmin } from '../config/supabase'
import { SendTestNotificationSchema } from '../schemas/preferences.schemas'
import { notificationDispatcher } from '../services/dispatcher/notification.dispatcher'

import { smtpStore } from '../config/smtpStore'

export const remindersRouter = Router()

/**
 * GET /api/v1/reminders/smtp-status
 * Consulta si el backend tiene SMTP configurado para enviar correos reales (público / no bloqueante).
 */
remindersRouter.get('/smtp-status', async (_req: Request, res: Response) => {
  if (!smtpStore.isDatabaseLoaded()) {
    await smtpStore.loadFromDatabase()
  }
  const cfg = smtpStore.get()
  const isConfigured = smtpStore.hasCredentials()
  res.json({
    configured: isConfigured,
    user: cfg.user || null,
    host: cfg.host || 'smtp.gmail.com',
    from: cfg.fromEmail || cfg.user || null,
    isGmail: (cfg.host || '').includes('gmail') || Boolean(cfg.user?.includes('@gmail.com')),
  })
})

/**
 * POST /api/v1/reminders/smtp-configure
 * Valida y guarda las credenciales SMTP en caliente, en el archivo .env y en app_settings de BD
 */
remindersRouter.post('/smtp-configure', async (req: Request, res: Response) => {
  try {
    const { user, pass, host, port, secure, from } = req.body
    if (!user || !pass) {
      return res.status(400).json({ error: 'Usuario (correo) y contraseña son requeridos' })
    }

    const cleanPass = (pass as string).replace(/\s+/g, '')
    const cleanUser = (user as string).trim()
    const cleanHost = (host as string)?.trim() || 'smtp.gmail.com'
    const isGmail = cleanHost.includes('gmail') || cleanUser.includes('@gmail.com')

    // Verificar en vivo con nodemailer (forzando IPv4)
    const testTransporter = nodemailer.createTransport({
      host: cleanHost,
      port: Number(port) || 587,
      secure: secure === true || secure === 'true',
      family: 4,
      auth: { user: cleanUser, pass: cleanPass },
    } as any)

    try {
      await testTransporter.verify()
    } catch (verifyErr) {
      const msg = verifyErr instanceof Error ? verifyErr.message : 'Fallo en la conexión SMTP'
      let friendlyError = msg
      if (msg.includes('535') || msg.includes('BadCredentials') || msg.includes('Username and Password not accepted')) {
        friendlyError = 'Google rechazó las credenciales (Error 535): Si usas Gmail, debes generar una "Contraseña de aplicación" de 16 caracteres en Google (Seguridad > Verificación en 2 pasos > Contraseñas de aplicaciones), NO la contraseña habitual.'
      } else if (msg.includes('ECONNREFUSED')) {
        friendlyError = 'No se pudo conectar con el servidor SMTP. Verifica el host y el puerto.'
      }
      return res.status(422).json({ error: friendlyError })
    }

    // 1. Actualizar memoria env
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(env as any).SMTP_USER = cleanUser
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(env as any).SMTP_PASS = cleanPass
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(env as any).SMTP_HOST = cleanHost
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (from) (env as any).SMTP_FROM = from

    process.env.SMTP_USER = cleanUser
    process.env.SMTP_PASS = cleanPass
    process.env.SMTP_HOST = cleanHost
    if (from) process.env.SMTP_FROM = from

    // 2. Actualizar SmtpConfigStore (fuente de verdad única en runtime)
    smtpStore.update({
      host: cleanHost,
      port: Number(port) || 587,
      secure: secure === true || secure === 'true',
      user: cleanUser,
      pass: cleanPass,
      fromEmail: from || cleanUser,
      fromName: 'AgendaPro Académico',
    })

    // 3. Persistir en app_settings de Supabase
    try {
      await supabaseAdmin.from('app_settings').upsert({
        id: 'global_config',
        smtp_host: cleanHost,
        smtp_port: Number(port) || 587,
        smtp_secure: secure === true || secure === 'true',
        smtp_user: cleanUser,
        smtp_pass: cleanPass,
        smtp_from_email: from || cleanUser,
        smtp_from_name: 'AgendaPro Académico',
        updated_at: new Date().toISOString(),
      })
    } catch (dbErr) {
      console.warn('[reminders.routes] Advertencia guardando SMTP en BD:', dbErr)
    }

    // 4. Actualizar o escribir en .env
    const envPath = path.resolve(__dirname, '../../.env')
    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, 'utf-8')
      const updateOrAdd = (key: string, val: string) => {
        const regex = new RegExp(`^#?\\s*${key}=.*$`, 'm')
        if (regex.test(content)) {
          content = content.replace(regex, `${key}=${val}`)
        } else {
          content += `\n${key}=${val}`
        }
      }
      updateOrAdd('SMTP_HOST', cleanHost)
      updateOrAdd('SMTP_PORT', port ? String(port) : '587')
      updateOrAdd('SMTP_SECURE', secure ? 'true' : 'false')
      updateOrAdd('SMTP_USER', cleanUser)
      updateOrAdd('SMTP_PASS', cleanPass)
      if (from) updateOrAdd('SMTP_FROM', from)
      fs.writeFileSync(envPath, content, 'utf-8')
    }

    // 5. Resetear transporte en el despachador
    notificationDispatcher.resetEmailAdapter()

    res.json({
      message: '¡Credenciales SMTP verificadas y activas! Ahora los correos se envían de verdad.',
      user: cleanUser,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al configurar SMTP'
    res.status(500).json({ error: message })
  }
})

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
