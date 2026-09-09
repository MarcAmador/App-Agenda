import { Router, type Request, type Response } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { requireAdminRole } from '../middlewares/admin.middleware'
import { AdminService } from '../services/admin.service'

export const adminRouter = Router()

// ─── Ruta pública de configuración visual (para que el Dashboard muestre el banner) ──
adminRouter.get('/public-settings', async (_req: Request, res: Response) => {
  try {
    const settings = await AdminService.getSettings()
    res.json({
      app_name: settings.app_name,
      app_logo_url: settings.app_logo_url,
      app_favicon_url: settings.app_favicon_url,
      app_description: settings.app_description,
      global_banner_enabled: settings.global_banner_enabled,
      global_banner_text: settings.global_banner_text,
      global_banner_type: settings.global_banner_type,
      theme_palette: settings.theme_palette,
      allow_signups: settings.allow_signups,
      allow_google_oauth: settings.allow_google_oauth,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: 'Error obteniendo configuración pública', details: msg })
  }
})

// ─── A partir de aquí todas las rutas requieren Autenticación y Rol Administrador ─────
adminRouter.use(authMiddleware)
adminRouter.use(requireAdminRole)

// 1. Métricas generales / Overview
adminRouter.get('/overview', async (_req: Request, res: Response) => {
  try {
    const data = await AdminService.getOverview()
    res.json(data)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: 'Error obteniendo overview', details: msg })
  }
})

// 2. Gestión de Usuarios
adminRouter.get('/users', async (req: Request, res: Response) => {
  try {
    const { page, limit, search, role, status } = req.query
    const data = await AdminService.getUsers({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search: search as string,
      role: role as string,
      status: status as string,
    })
    res.json(data)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: 'Error obteniendo usuarios', details: msg })
  }
})

adminRouter.patch('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const { role } = req.body
    if (!['super_admin', 'admin', 'support', 'user'].includes(role)) {
      res.status(400).json({ error: 'Rol inválido' })
      return
    }
    await AdminService.updateUserRole(req.params.id, role, req.userEmail || 'admin')
    res.json({ success: true, message: `Rol actualizado a ${role}` })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: 'Error actualizando rol', details: msg })
  }
})

adminRouter.patch('/users/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body
    if (!['active', 'suspended'].includes(status)) {
      res.status(400).json({ error: 'Estado inválido' })
      return
    }
    await AdminService.updateUserStatus(req.params.id, status, req.userEmail || 'admin')
    res.json({ success: true, message: `Estado de usuario actualizado a ${status}` })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: 'Error actualizando estado', details: msg })
  }
})

adminRouter.post('/users/:id/reset-sessions', async (req: Request, res: Response) => {
  try {
    await AdminService.resetUserSessions(req.params.id, req.userEmail || 'admin')
    res.json({ success: true, message: 'Sesiones remotas revocadas exitosamente.' })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: 'Error revocando sesiones', details: msg })
  }
})

adminRouter.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    await AdminService.deleteUser(req.params.id, req.userEmail || 'admin')
    res.json({ success: true, message: 'Usuario eliminado permanentemente.' })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: 'Error eliminando usuario', details: msg })
  }
})

// 3. Plantillas de Correo
adminRouter.get('/templates', async (_req: Request, res: Response) => {
  try {
    const templates = await AdminService.getTemplates()
    res.json(templates)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: 'Error obteniendo plantillas', details: msg })
  }
})

adminRouter.put('/templates/:slug', async (req: Request, res: Response) => {
  try {
    const updated = await AdminService.updateTemplate(req.params.slug, req.body, req.userEmail || 'admin')
    res.json({ success: true, template: updated })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: 'Error actualizando plantilla', details: msg })
  }
})

adminRouter.post('/templates/:slug/test', async (req: Request, res: Response) => {
  try {
    const { recipientEmail, customVariables } = req.body
    if (!recipientEmail) {
      res.status(400).json({ error: 'Se requiere el correo del destinatario' })
      return
    }
    const result = await AdminService.sendTestTemplateEmail(req.params.slug, recipientEmail, customVariables)
    res.json({ success: true, messageId: result.messageId, message: `Correo de prueba enviado exitosamente a ${recipientEmail}` })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: 'Fallo al enviar correo de prueba', details: msg })
  }
})

// 4. Centro de Emails / Logs
adminRouter.get('/emails', async (req: Request, res: Response) => {
  try {
    const { status, search, page, limit } = req.query
    const result = await AdminService.getEmailLogs({
      status: status as string,
      search: search as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    })
    res.json(result)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: 'Error obteniendo logs de email', details: msg })
  }
})

adminRouter.post('/emails/:id/retry', async (req: Request, res: Response) => {
  try {
    await AdminService.retryEmail(req.params.id, req.userEmail || 'admin')
    res.json({ success: true, message: 'Reintento de despacho programado.' })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: 'Error al reintentar email', details: msg })
  }
})

// 5. Configuración Global & SMTP Dedicado
adminRouter.get('/settings', async (_req: Request, res: Response) => {
  try {
    const settings = await AdminService.getSettings()
    res.json(settings)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: 'Error obteniendo configuración', details: msg })
  }
})

adminRouter.put('/settings', async (req: Request, res: Response) => {
  try {
    const updated = await AdminService.updateSettings(req.body, req.userEmail || 'admin')
    res.json({ success: true, settings: updated })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: 'Error guardando configuración', details: msg })
  }
})

adminRouter.post('/settings/test-smtp', async (req: Request, res: Response) => {
  try {
    const result = await AdminService.testSmtp(req.body)
    res.json(result)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: 'Fallo al verificar SMTP', details: msg })
  }
})

// 6. Audit Logs
adminRouter.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const { limit, action, search } = req.query
    const logs = await AdminService.getAuditLogs({
      limit: limit ? Number(limit) : 50,
      action: action as string,
      search: search as string,
    })
    res.json(logs)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: 'Error obteniendo audit logs', details: msg })
  }
})

// 7. Google OAuth Stats
adminRouter.get('/oauth-stats', async (_req: Request, res: Response) => {
  try {
    const stats = await AdminService.getOAuthStats()
    res.json(stats)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: 'Error obteniendo estadísticas OAuth', details: msg })
  }
})
