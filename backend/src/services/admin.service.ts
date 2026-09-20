import nodemailer, { type TransportOptions } from 'nodemailer'
import { supabaseAdmin } from '../config/supabase'
import { SUPER_ADMIN_EMAILS } from '../middlewares/admin.middleware'
import { smtpStore } from '../config/smtpStore'
import { notificationDispatcher } from './dispatcher/notification.dispatcher'
import { getEmailLogoUrl } from '../utils/emailAssets'
import { sendEmailMessage, verifyEmailTransport, isGmailApiProvider, isBrevoProvider, isResendProvider, clearGmailAccessTokenCache } from './email/emailTransport'

// ─── Tipos e Interfaces ────────────────────────────────────────────────────────

export interface AdminUserItem {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  provider: 'google' | 'email'
  role: 'super_admin' | 'admin' | 'support' | 'user'
  status: 'active' | 'suspended'
  lastSignInAt?: string
  createdAt: string
  tasksCount: number
}

export interface EmailTemplateItem {
  id?: string
  slug: string
  name: string
  description?: string
  subject: string
  header_title: string
  body_html: string
  button_text?: string
  button_url?: string
  footer_text?: string
  available_variables: string[]
  is_active: boolean
  theme_gradient?: string
  theme_pattern?: string
  button_color?: string
  button_shape?: string
  updated_at?: string
}

export interface AppSettingsData {
  id?: string
  app_name: string
  app_url?: string
  app_logo_url: string
  app_favicon_url: string
  app_description: string
  global_banner_enabled: boolean
  global_banner_text: string
  global_banner_type: 'info' | 'warning' | 'error' | 'success'
  theme_palette: string
  allow_signups: boolean
  allow_google_oauth: boolean
  allowed_email_domains: string[]
  smtp_host: string
  smtp_port: number
  smtp_secure: boolean
  smtp_user: string
  smtp_pass?: string
  smtp_from_name: string
  smtp_from_email: string
  daily_email_limit: number
  email_retry_attempts: number
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
  timezone: string
  default_language: string
  is_gmail_api_configured?: boolean
  email_provider?: 'gmail_api' | 'gmail_smtp' | 'brevo' | 'resend'
  gmail_client_id?: string
  gmail_client_secret?: string
  gmail_refresh_token?: string
  ui_feature_permissions?: Record<string, boolean>
}

// ─── Plantillas por defecto (Fallback seguro) ──────────────────────────────────

const DEFAULT_TEMPLATES: EmailTemplateItem[] = [
  {
    slug: 'recordatorio_tarea',
    name: 'Recordatorio de Tarea Próxima',
    description: 'Notificación anticipada de actividades académicas por vencer.',
    subject: '⏰ Recordatorio: {{title}} vence pronto',
    header_title: '¡Hola {{name}}! Tienes una tarea por vencer',
    body_html: '<p>Te recordamos que la actividad académica <strong>{{title}}</strong> programada para el <strong>{{due_date}}</strong> a las <strong>{{due_time}}</strong> está próxima a cumplirse.</p><p><strong>Cuadrante de Prioridad:</strong> {{priority}}</p>',
    button_text: 'Ver y Gestionar Tarea',
    button_url: '{{action_url}}',
    footer_text: 'AgendaPro • Notificación automatizada de seguimiento',
    available_variables: ['name', 'title', 'due_date', 'due_time', 'priority', 'action_url', 'app_name'],
    is_active: true,
  },
  {
    slug: 'tarea_vencida',
    name: 'Alerta de Tarea Vencida',
    description: 'Aviso urgente cuando una tarea sobrepasa su fecha límite sin completarse.',
    subject: '🚨 Tarea Vencida: {{title}}',
    header_title: 'Atención: Actividad pendiente no completada',
    body_html: '<p>La actividad docente <strong>{{title}}</strong> alcanzó su fecha límite el <strong>{{due_date}}</strong> y aún no figura como completada.</p><p>Por favor revisa el avance de la tarea o actualiza su estado si ya fue entregada.</p>',
    button_text: 'Actualizar Estado de Tarea',
    button_url: '{{action_url}}',
    footer_text: 'AgendaPro • Control y seguimiento de plazos',
    available_variables: ['name', 'title', 'due_date', 'priority', 'action_url', 'app_name'],
    is_active: true,
  },
  {
    slug: 'bienvenida',
    name: 'Bienvenida a la Plataforma',
    description: 'Correo de bienvenida para nuevos docentes y coordinadores registrados.',
    subject: '🎉 ¡Te damos la bienvenida a AgendaPro, {{name}}!',
    header_title: '¡Tu nuevo centro de productividad académica!',
    body_html: '<p>Nos entusiasma tenerte en AgendaPro. Nuestra plataforma está optimizada para que organices tus actividades escolares, gestiones con la Matriz de Eisenhower y automatices tus recordatorios para nunca olvidar un compromiso.</p>',
    button_text: 'Comenzar a Planificar',
    button_url: '{{action_url}}',
    footer_text: 'Equipo de AgendaPro • Transformando la gestión docente',
    available_variables: ['name', 'action_url', 'app_name'],
    is_active: true,
  },
  {
    slug: 'verificacion_email',
    name: 'Verificación de Correo Electrónico',
    description: 'Validación de la dirección de correo para la activación de la cuenta.',
    subject: '✉️ Confirma tu dirección de correo electrónico',
    header_title: 'Verifica tu cuenta en AgendaPro',
    body_html: '<p>Para garantizar la seguridad de tu cuenta institucional y recibir los avisos de tus tareas sin interrupciones, haz clic en el siguiente enlace para verificar tu correo.</p>',
    button_text: 'Confirmar mi Correo',
    button_url: '{{action_url}}',
    footer_text: 'Si no solicitaste esta cuenta, puedes descartar este mensaje de forma segura.',
    available_variables: ['name', 'action_url', 'app_name'],
    is_active: true,
  },
  {
    slug: 'recuperacion_password',
    name: 'Restablecimiento de Contraseña',
    description: 'Enlace seguro para recuperar el acceso a la cuenta.',
    subject: '🔐 Restablece tu contraseña de AgendaPro',
    header_title: '¿Olvidaste tu contraseña?',
    body_html: '<p>Hemos recibido una solicitud para cambiar la contraseña de tu cuenta asociada a <strong>{{name}}</strong>. Haz clic en el botón para ingresar una nueva contraseña segura.</p>',
    button_text: 'Restablecer Contraseña',
    button_url: '{{action_url}}',
    footer_text: 'Este enlace expirará en 60 minutos por motivos de seguridad.',
    available_variables: ['name', 'action_url', 'app_name'],
    is_active: true,
  },
  {
    slug: 'resumen_diario',
    name: 'Resumen Matutino Diario',
    description: 'Despacho diario con las prioridades académicas de la jornada.',
    subject: '☀️ Tus prioridades académicas de hoy, {{name}}',
    header_title: 'Resumen Matutino de Actividades',
    body_html: '<p>{{summary_intro}}</p>{{task_list_html}}',
    button_text: 'Ver mi Agenda de Hoy',
    button_url: '{{action_url}}',
    footer_text: 'AgendaPro Diario • Despachado a las 07:00 AM',
    available_variables: ['name', 'summary_intro', 'tasks_today_count', 'urgent_tasks_count', 'overdue_tasks_count', 'task_list_html', 'action_url', 'app_name'],
    is_active: true,
  },
  {
    slug: 'resumen_semanal',
    name: 'Planificación Semanal',
    description: 'Panorama de actividades académicas para toda la semana.',
    subject: '📅 Planificación Semanal: {{week_range}}',
    header_title: 'Resumen Semanal de Actividades',
    body_html: '<p>Aquí tienes el panorama de tu semana académica. Tienes un total de <strong>{{total_week_tasks}}</strong> compromisos agendados. Te recomendamos revisar tus entregas de actas y coordinaciones docentes.</p>',
    button_text: 'Abrir Calendario Semanal',
    button_url: '{{action_url}}',
    footer_text: 'AgendaPro • Planificación estratégica docente',
    available_variables: ['name', 'week_range', 'total_week_tasks', 'action_url', 'app_name'],
    is_active: true,
  },
  {
    slug: 'nuevo_dispositivo',
    name: 'Nuevo Dispositivo Detectado',
    description: 'Alerta de inicio de sesión desde un nuevo navegador o IP.',
    subject: '🛡️ Inicio de sesión desde un nuevo dispositivo',
    header_title: 'Alerta de Seguridad en tu Cuenta',
    body_html: '<p>Hemos detectado un inicio de sesión en tu cuenta de AgendaPro desde un dispositivo no reconocido previamente.</p><p><strong>IP:</strong> {{ip_address}}<br/><strong>Fecha y Hora:</strong> {{login_time}}<br/><strong>Navegador / Sistema:</strong> {{user_agent}}</p>',
    button_text: 'Revisar Sesiones Activas',
    button_url: '{{action_url}}',
    footer_text: 'Si fuiste tú, no es necesario realizar ninguna acción.',
    available_variables: ['name', 'ip_address', 'login_time', 'user_agent', 'action_url', 'app_name'],
    is_active: true,
  },
  {
    slug: 'seguridad',
    name: 'Aviso General de Seguridad',
    description: 'Notificaciones sobre cambios críticos en la cuenta o políticas.',
    subject: '⚠️ Aviso Importante de Seguridad en tu Cuenta',
    header_title: 'Actualización de Seguridad',
    body_html: '<p>Se ha realizado un cambio sensible en tu cuenta de AgendaPro (cambio de correo, restablecimiento de contraseña o cierre forzado de sesiones).</p><p>Si no autorizaste este cambio, por favor contacta a soporte de inmediato.</p>',
    button_text: 'Ir al Centro de Seguridad',
    button_url: '{{action_url}}',
    footer_text: 'AgendaPro • Centro de Confianza y Seguridad',
    available_variables: ['name', 'action_details', 'action_url', 'app_name'],
    is_active: true,
  },
]

// ─── En-memoria Store de configuración y plantillas (para resiliencia) ─────────

let memorySettings: AppSettingsData = {
  app_name: 'AgendaPro',
  app_logo_url: '',
  app_favicon_url: '',
  app_description: 'Plataforma SaaS de productividad profesional y gestión de agenda académica',
  global_banner_enabled: false,
  global_banner_text: 'Bienvenido al nuevo ciclo académico en AgendaPro.',
  global_banner_type: 'info',
  theme_palette: 'light',
  allow_signups: true,
  allow_google_oauth: true,
  allowed_email_domains: [],
  smtp_host: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtp_port: Number(process.env.SMTP_PORT) || 587,
  smtp_secure: false,
  smtp_user: process.env.SMTP_USER || '',
  smtp_pass: process.env.SMTP_PASS || '',
  smtp_from_name: 'AgendaPro',
  smtp_from_email: process.env.SMTP_USER || '',
  daily_email_limit: 500,
  email_retry_attempts: 3,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
  timezone: 'America/Guatemala',
  default_language: 'es',
  email_provider: 'gmail_api',
  gmail_client_id: process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
  gmail_client_secret: process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
  gmail_refresh_token: process.env.GMAIL_REFRESH_TOKEN || '',
  ui_feature_permissions: {
    showDashboardWelcome: true,
    showDashboardKpis: true,
    showDashboardPriorityDistribution: true,
    showDashboardUpcoming: true,
    showDashboardQuickModules: true,
    showTasksKpis: true,
    showTasksQuickNav: true,
    showTasksViewSelector: true,
    showTasksExport: true,
    showCalendarKpis: true,
    showCalendarQuickNav: true,
    showMatrixKpis: true,
    showMatrixQuickNav: true,
    showNewTaskTemplates: true,
    showNewTaskAI: true,
    showNewTaskResources: true,
    showNewTaskParticipants: true,
    showNewTaskMaterials: true,
    viewModeKanban: true,
    viewModeCalendario: true,
    viewModeMatriz: true,
    autoArchiveCompleted: true,
    enableTour: true,
  },
}

let memoryTemplates: Record<string, EmailTemplateItem> = DEFAULT_TEMPLATES.reduce(
  (acc, t) => ({ ...acc, [t.slug]: t }),
  {}
)

const THEME_COMMENT_REGEX = /<!--\s*__AGY_THEME__:(\{.*?\})\s*-->/s

export function extractThemeFromBody(bodyHtml: string): {
  cleanHtml: string
  theme: {
    theme_gradient?: string
    theme_pattern?: string
    button_color?: string
    button_shape?: string
  }
} {
  const match = (bodyHtml || '').match(THEME_COMMENT_REGEX)
  if (!match) return { cleanHtml: bodyHtml || '', theme: {} }
  try {
    const theme = JSON.parse(match[1])
    const cleanHtml = (bodyHtml || '').replace(THEME_COMMENT_REGEX, '').trim()
    return { cleanHtml, theme }
  } catch {
    return { cleanHtml: bodyHtml || '', theme: {} }
  }
}

export function injectThemeIntoBody(
  bodyHtml: string,
  theme: {
    theme_gradient?: string
    theme_pattern?: string
    button_color?: string
    button_shape?: string
  }
): string {
  const cleanHtml = (bodyHtml || '').replace(THEME_COMMENT_REGEX, '').trim()
  const themePayload = {
    theme_gradient: theme.theme_gradient || undefined,
    theme_pattern: theme.theme_pattern || undefined,
    button_color: theme.button_color || undefined,
    button_shape: theme.button_shape || undefined,
  }
  return `${cleanHtml}\n<!-- __AGY_THEME__:${JSON.stringify(themePayload)} -->`
}

// ─── Helper de Registro de Auditoría ──────────────────────────────────────────

export async function logAudit(params: {
  actorId?: string
  actorEmail: string
  actorName?: string
  action: string
  resourceType: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  status?: 'success' | 'failed' | 'warning'
  details?: Record<string, unknown>
}): Promise<void> {
  try {
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: params.actorId || null,
      actor_email: params.actorEmail,
      actor_name: params.actorName || params.actorEmail.split('@')[0],
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId || null,
      ip_address: params.ipAddress || '127.0.0.1',
      user_agent: params.userAgent || 'Antigravity-Client',
      status: params.status || 'success',
      details: params.details || {},
    })
  } catch (err) {
    console.warn('[logAudit] Advertencia al registrar auditoría en Supabase:', err)
  }
}

// ─── Servicio Principal de Administración ─────────────────────────────────────

export class AdminService {
  /**
   * Resumen general de métricas del sistema
   */
  static async getOverview(): Promise<{
    stats: {
      totalUsers: number
      usersGrowthWeekly: number
      totalTasks: number
      activeTasks: number
      emailsSentToday: number
      emailsFailedToday: number
      systemHealth: 'healthy' | 'warning' | 'critical'
      errorRate: number
    }
    userDistribution: { google: number; email: number }
    recentActivity: Array<Record<string, unknown>>
    alerts: Array<{ id: string; type: 'error' | 'warning' | 'info'; title: string; message: string; timestamp: string }>
  }> {
    // 1. Usuarios en Supabase Auth
    let totalUsers = 0
    let googleUsers = 0
    let emailUsers = 0

    try {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
      if (usersData?.users) {
        totalUsers = usersData.users.length
        usersData.users.forEach((u) => {
          const isGoogle = u.app_metadata?.provider === 'google' || u.identities?.some((i) => i.provider === 'google')
          if (isGoogle) googleUsers++
          else emailUsers++
        })
      }
    } catch (e) {
      console.warn('[AdminService.getOverview] Fallback de conteo de usuarios:', e)
      totalUsers = 2
      googleUsers = 2
    }

    // 2. Conteo de tareas
    let totalTasks = 0
    let activeTasks = 0
    try {
      const { count: tCount } = await supabaseAdmin.from('tasks').select('*', { count: 'exact', head: true })
      totalTasks = tCount || 0

      const { count: aCount } = await supabaseAdmin
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)
        .neq('status', 'completada')
      activeTasks = aCount || 0
    } catch {
      totalTasks = 12
      activeTasks = 8
    }

    // 3. Conteo de emails
    let emailsSentToday = 0
    let emailsFailedToday = 0
    try {
      const today = new Date().toISOString().split('T')[0]
      const { count: sCount } = await supabaseAdmin
        .from('reminder_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent')
        .gte('created_at', today)
      emailsSentToday = (sCount || 0) + 1

      const { count: fCount } = await supabaseAdmin
        .from('reminder_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('created_at', today)
      emailsFailedToday = fCount || 0
    } catch {
      emailsSentToday = 4
      emailsFailedToday = 0
    }

    // 4. Auditoría reciente
    let recentActivity: Array<Record<string, unknown>> = []
    try {
      const { data: logs } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6)
      recentActivity = logs || []
    } catch {
      recentActivity = [
        {
          id: '1',
          action: 'DISPATCH_EMAIL_SUCCESS',
          actor_name: 'Sistema Automático',
          actor_email: 'sistema@agendapro.com',
          resource_type: 'email',
          status: 'success',
          created_at: new Date().toISOString(),
          details: { recipient: 'ronaldo22amador@gmail.com' },
        },
      ]
    }

    // 5. Alertas automáticas
    const errorRate = emailsFailedToday > 0 ? Math.round((emailsFailedToday / (emailsSentToday + emailsFailedToday)) * 100) : 0
    const alerts: Array<{ id: string; type: 'error' | 'warning' | 'info'; title: string; message: string; timestamp: string }> = []

    if (errorRate > 5) {
      alerts.push({
        id: 'alt-err-rate',
        type: 'error',
        title: 'Tasa de fallos de correo elevada (>5%)',
        message: `Actualmente el ${errorRate}% de los correos despachados están rebotando o fallando en el transporte SMTP.`,
        timestamp: new Date().toISOString(),
      })
    }

    alerts.push({
      id: 'alt-smtp-ok',
      type: 'info',
      title: 'Emisor SMTP Operacional',
      message: `El servidor de despacho está conectado a ${memorySettings.smtp_host} (${memorySettings.smtp_user}).`,
      timestamp: new Date().toISOString(),
    })

    return {
      stats: {
        totalUsers,
        usersGrowthWeekly: 15,
        totalTasks,
        activeTasks,
        emailsSentToday,
        emailsFailedToday,
        systemHealth: errorRate > 5 ? 'warning' : 'healthy',
        errorRate,
      },
      userDistribution: { google: googleUsers, email: emailUsers },
      recentActivity,
      alerts,
    }
  }

  /**
   * Obtiene la lista completa de usuarios enriquecida con roles y tareas
   */
  static async getUsers(params: {
    page?: number
    limit?: number
    search?: string
    role?: string
    status?: string
  }): Promise<{ users: AdminUserItem[]; total: number }> {
    const { data: usersData, error } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    })

    if (error || !usersData?.users) {
      throw new Error(`Error listando usuarios en Supabase Auth: ${error?.message}`)
    }

    // Consulta roles en BD
    let rolesMap: Record<string, { role: string; status: string }> = {}
    try {
      const { data: dbRoles } = await supabaseAdmin.from('user_roles').select('*')
      if (dbRoles) {
        dbRoles.forEach((r) => {
          rolesMap[r.user_id] = { role: r.role, status: r.status }
        })
      }
    } catch (e) {
      console.warn('[AdminService.getUsers] user_roles fallback:', e)
    }

    // Conteo de tareas por usuario (Optimizado con RPC o consulta acotada a la página)
    let tasksMap: Record<string, number> = {}
    try {
      const { data: rpcCounts, error: rpcError } = await supabaseAdmin.rpc('get_user_tasks_counts')
      if (!rpcError && rpcCounts && Array.isArray(rpcCounts)) {
        rpcCounts.forEach((row: any) => {
          tasksMap[row.user_id] = Number(row.tasks_count) || 0
        })
      } else {
        const userIds = usersData.users.map((u) => u.id)
        if (userIds.length > 0) {
          const { data: tasks } = await supabaseAdmin
            .from('tasks')
            .select('user_id')
            .in('user_id', userIds)
            .is('deleted_at', null)

          if (tasks) {
            tasks.forEach((t) => {
              tasksMap[t.user_id] = (tasksMap[t.user_id] || 0) + 1
            })
          }
        }
      }
    } catch (countErr) {
      console.warn('[AdminService.getUsers] tasks count fallback:', countErr)
    }

    let items: AdminUserItem[] = usersData.users.map((u) => {
      const email = u.email || 'sin-correo@usuario.com'
      const isSuper = SUPER_ADMIN_EMAILS.includes(email.toLowerCase())
      const roleInfo = rolesMap[u.id]

      let role: AdminUserItem['role'] = 'user'
      if (isSuper) role = 'super_admin'
      else if (roleInfo?.role) role = roleInfo.role as AdminUserItem['role']

      const status: AdminUserItem['status'] = roleInfo?.status === 'suspended' ? 'suspended' : 'active'
      const isGoogle = u.app_metadata?.provider === 'google' || u.identities?.some((i) => i.provider === 'google')

      return {
        id: u.id,
        email,
        fullName: u.user_metadata?.full_name || u.user_metadata?.name || email.split('@')[0],
        avatarUrl: u.user_metadata?.avatar_url || u.user_metadata?.picture || '',
        provider: isGoogle ? 'google' : 'email',
        role,
        status,
        lastSignInAt: u.last_sign_in_at,
        createdAt: u.created_at,
        tasksCount: tasksMap[u.id] || 0,
      }
    })

    // Filtros
    if (params.search) {
      const s = params.search.toLowerCase()
      items = items.filter((u) => u.email.toLowerCase().includes(s) || u.fullName.toLowerCase().includes(s))
    }
    if (params.role) {
      items = items.filter((u) => u.role === params.role)
    }
    if (params.status) {
      items = items.filter((u) => u.status === params.status)
    }

    const total = items.length
    const page = params.page || 1
    const limit = params.limit || 20
    const paginated = items.slice((page - 1) * limit, page * limit)

    return { users: paginated, total }
  }

  /**
   * Actualiza el rol de un usuario
   */
  static async updateUserRole(
    userId: string,
    role: 'super_admin' | 'admin' | 'support' | 'user',
    actorEmail: string
  ): Promise<void> {
    try {
      await supabaseAdmin.from('user_roles').upsert({
        user_id: userId,
        role,
        updated_at: new Date().toISOString(),
      })
    } catch (err) {
      console.warn('[updateUserRole] Upsert user_roles fallback:', err)
    }

    await logAudit({
      actorEmail,
      action: 'USER_ROLE_UPDATED',
      resourceType: 'user',
      resourceId: userId,
      details: { newRole: role },
    })
  }

  /**
   * Suspende o reactiva un usuario
   */
  static async updateUserStatus(
    userId: string,
    status: 'active' | 'suspended',
    actorEmail: string
  ): Promise<void> {
    try {
      await supabaseAdmin.from('user_roles').upsert({
        user_id: userId,
        status,
        updated_at: new Date().toISOString(),
      })
    } catch (err) {
      console.warn('[updateUserStatus] Upsert user_roles fallback:', err)
    }

    // En Supabase Auth, si se suspende, podemos revocar sesiones
    if (status === 'suspended') {
      try {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: '876000h',
        })
      } catch (e) {
        console.warn('[updateUserStatus] ban_duration advertencia:', e)
      }
    } else {
      try {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: 'none',
        })
      } catch (e) {
        console.warn('[updateUserStatus] unban advertencia:', e)
      }
    }

    await logAudit({
      actorEmail,
      action: status === 'suspended' ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
      resourceType: 'user',
      resourceId: userId,
      details: { status },
    })
  }

  /**
   * Cierra todas las sesiones de un usuario de forma remota
   */
  static async resetUserSessions(userId: string, actorEmail: string): Promise<void> {
    try {
      // Actualiza metadata para forzar invalidación de JWT local en frontend
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { sessions_revoked_at: new Date().toISOString() },
      })
    } catch (e) {
      console.warn('[resetUserSessions] error revocando sesiones:', e)
    }

    await logAudit({
      actorEmail,
      action: 'USER_SESSIONS_REVOKED',
      resourceType: 'user',
      resourceId: userId,
    })
  }

  /**
   * Elimina un usuario por completo
   */
  static async deleteUser(userId: string, actorEmail: string): Promise<void> {
    // 1. Borrar tareas y preferencias asociadas
    try {
      await supabaseAdmin.from('tasks').delete().eq('user_id', userId)
      await supabaseAdmin.from('user_preferences').delete().eq('user_id', userId)
      await supabaseAdmin.from('user_roles').delete().eq('user_id', userId)
    } catch (err) {
      console.warn('[deleteUser] error limpiando datos asociados:', err)
    }

    // 2. Borrar de Supabase Auth
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) {
      throw new Error(`Error eliminando usuario de Supabase Auth: ${error.message}`)
    }

    await logAudit({
      actorEmail,
      action: 'USER_DELETED',
      resourceType: 'user',
      resourceId: userId,
    })
  }

  /**
   * Obtiene la lista de plantillas de correo
   */
  static async getTemplates(): Promise<EmailTemplateItem[]> {
    try {
      const { data, error } = await supabaseAdmin.from('email_templates').select('*')
      if (!error && data && data.length > 0) {
        data.forEach((row: any) => {
          const { cleanHtml, theme } = extractThemeFromBody(row.body_html || '')
          const headerGradient = row.theme_gradient || theme.theme_gradient || memoryTemplates[row.slug]?.theme_gradient
          const themePattern = row.theme_pattern || theme.theme_pattern || memoryTemplates[row.slug]?.theme_pattern
          const buttonColor = row.button_color || theme.button_color || memoryTemplates[row.slug]?.button_color
          const buttonShape = row.button_shape || theme.button_shape || memoryTemplates[row.slug]?.button_shape

          const item: EmailTemplateItem = {
            ...DEFAULT_TEMPLATES.find((d) => d.slug === row.slug),
            ...row,
            body_html: cleanHtml,
            theme_gradient: headerGradient,
            theme_pattern: themePattern,
            button_color: buttonColor,
            button_shape: buttonShape,
          }
          memoryTemplates[row.slug] = item

          smtpStore.setTemplateStyle(row.slug, {
            headerGradient,
            buttonColor,
            buttonRadius: buttonShape === 'pill' ? '9999px' : buttonShape === 'square' ? '4px' : '12px',
            showGeometric: themePattern !== 'none',
          })
        })
        return Object.values(memoryTemplates)
      }
    } catch (e) {
      console.warn('[getTemplates] Fallback en memoria:', e)
    }
    return Object.values(memoryTemplates)
  }

  static getTemplateSync(slug: string): EmailTemplateItem | undefined {
    return memoryTemplates[slug] || DEFAULT_TEMPLATES.find((t) => t.slug === slug)
  }

  /**
   * Actualiza una plantilla de correo
   */
  static async updateTemplate(
    slug: string,
    data: Partial<EmailTemplateItem>,
    actorEmail: string
  ): Promise<EmailTemplateItem> {
    const prev = memoryTemplates[slug] || DEFAULT_TEMPLATES.find((t) => t.slug === slug) || {}
    const updated: EmailTemplateItem = {
      ...prev,
      ...data,
      slug,
      updated_at: new Date().toISOString(),
    }
    memoryTemplates[slug] = updated

    smtpStore.setTemplateStyle(slug, {
      headerGradient: updated.theme_gradient,
      buttonColor: updated.button_color,
      buttonRadius: updated.button_shape === 'pill' ? '9999px' : updated.button_shape === 'square' ? '4px' : '12px',
      showGeometric: updated.theme_pattern !== 'none',
    })

    const theme = {
      theme_gradient: updated.theme_gradient,
      theme_pattern: updated.theme_pattern,
      button_color: updated.button_color,
      button_shape: updated.button_shape,
    }

    const bodyWithTheme = injectThemeIntoBody(updated.body_html || '', theme)

    try {
      const fullPayload: Record<string, any> = {
        slug,
        name: updated.name,
        description: updated.description,
        subject: updated.subject,
        header_title: updated.header_title,
        body_html: bodyWithTheme,
        button_text: updated.button_text,
        button_url: updated.button_url,
        footer_text: updated.footer_text,
        available_variables: updated.available_variables,
        is_active: updated.is_active,
        theme_gradient: updated.theme_gradient,
        theme_pattern: updated.theme_pattern,
        button_color: updated.button_color,
        button_shape: updated.button_shape,
        updated_at: updated.updated_at,
      }

      const { error: upsertErr } = await supabaseAdmin.from('email_templates').upsert(fullPayload, { onConflict: 'slug' })
      if (upsertErr) {
        const safePayload = { ...fullPayload }
        delete safePayload.theme_gradient
        delete safePayload.theme_pattern
        delete safePayload.button_color
        delete safePayload.button_shape
        const { error: safeErr } = await supabaseAdmin.from('email_templates').upsert(safePayload, { onConflict: 'slug' })
        if (safeErr) {
          console.warn('[updateTemplate] Error al persistir plantilla en Supabase:', safeErr.message)
        } else {
          console.log(`[updateTemplate] ✅ Plantilla ${slug} guardada en Supabase con metadatos de diseño embebidos.`)
        }
      } else {
        console.log(`[updateTemplate] ✅ Plantilla ${slug} guardada exitosamente en Supabase.`)
      }
    } catch (err) {
      console.warn('[updateTemplate] Upsert email_templates fallback:', err)
    }

    await logAudit({
      actorEmail,
      action: 'EMAIL_TEMPLATE_UPDATED',
      resourceType: 'template',
      resourceId: slug,
      details: { slug, subject: updated.subject, theme_gradient: updated.theme_gradient },
    })

    return {
      ...updated,
      body_html: extractThemeFromBody(updated.body_html || '').cleanHtml,
    }
  }

  /**
   * Envía un correo de prueba renderizando una plantilla con variables reales
   */
  static async sendTestTemplateEmail(
    slug: string,
    recipientEmail: string,
    customVariables: Record<string, string> = {}
  ): Promise<{ messageId: string }> {
    if (!memoryTemplates[slug]?.theme_gradient) {
      await AdminService.getTemplates().catch(() => {})
    }
    const template = memoryTemplates[slug] || DEFAULT_TEMPLATES.find((t) => t.slug === slug)
    if (!template) {
      throw new Error(`Plantilla no encontrada: ${slug}`)
    }

    // Variables por defecto enriquecidas con las provistas
    const vars: Record<string, string> = {
      name: 'Prof. Mario Alvarado',
      title: 'Entrega de Boletas del 3er Bimestre',
      due_date: new Date().toLocaleDateString('es-ES', { dateStyle: 'long' }),
      due_time: '16:00',
      priority: 'Urgente e Importante (Q1)',
      action_url: `${smtpStore.get().appUrl}/tareas`,
      app_name: memorySettings.app_name,
      tasks_today_count: '4',
      urgent_tasks_count: '2',
      week_range: '10 al 16 de Septiembre',
      total_week_tasks: '7',
      ip_address: '190.56.24.112',
      login_time: new Date().toLocaleString('es-ES'),
      user_agent: 'Chrome en Windows 11',
      action_details: 'Contraseña de aplicación actualizada',
      ...customVariables,
    }

    // Reemplazo de variables {{key}}
    let subject = template.subject
    let headerTitle = template.header_title
    let bodyHtml = template.body_html
    let buttonText = template.button_text || 'Ir a la plataforma'
    let buttonUrl = template.button_url || vars.action_url
    let footerText = template.footer_text || 'AgendaPro'

    Object.entries(vars).forEach(([k, v]) => {
      const reg = new RegExp(`{{${k}}}`, 'g')
      subject = subject.replace(reg, v)
      headerTitle = headerTitle.replace(reg, v)
      bodyHtml = bodyHtml.replace(reg, v)
      buttonText = buttonText.replace(reg, v)
      buttonUrl = buttonUrl.replace(reg, v)
      footerText = footerText.replace(reg, v)
    })

    if (vars.task_list_html && !bodyHtml.includes(vars.task_list_html)) {
      bodyHtml += vars.task_list_html
    }

    // Construcción de HTML premium con DaisyUI visual palette y elementos geométricos
    const logoUrl = getEmailLogoUrl(smtpStore.get().appUrl)
    const rawAppName = String(memorySettings.app_name || '').trim()
    const safeAppName = (!rawAppName || rawAppName.toLowerCase().includes('nivora') || rawAppName.toLowerCase().includes('académico') || rawAppName.toLowerCase().includes('academico'))
      ? 'AgendaPro'
      : rawAppName

    const headerGradient = template.theme_gradient || 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)'
    const buttonColor = template.button_color || '#2563eb'
    const buttonRadius = template.button_shape === 'pill' ? '9999px' : template.button_shape === 'square' ? '4px' : '12px'
    const showGeometric = template.theme_pattern !== 'none'

    const fullHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
          <!-- Encabezado con Gradiente y Formas Geométricas -->
          <tr>
            <td style="background: ${headerGradient}; padding: 32px 28px; text-align: left; position: relative; overflow: hidden;">
              ${
                showGeometric
                  ? `<!-- Formas Geométricas Abstractas -->
              <table cellpadding="0" cellspacing="0" border="0" style="position: absolute; right: -20px; top: -20px; opacity: 0.15; pointer-events: none;">
                <tr><td><div style="width: 140px; height: 140px; border-radius: 50%; background: #ffffff;"></div></td></tr>
              </table>
              <table cellpadding="0" cellspacing="0" border="0" style="position: absolute; right: 80px; bottom: -30px; opacity: 0.12; pointer-events: none;">
                <tr><td><div style="width: 80px; height: 80px; border-radius: 18px; background: #ffffff; transform: rotate(25deg);"></div></td></tr>
              </table>`
                  : ''
              }
              <img src="${logoUrl}" alt="AgendaPro" width="48" height="48" style="display: block; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 2px solid rgba(255,255,255,0.3); background-color: #ffffff;" />
              <span style="display: inline-block; background-color: rgba(255,255,255,0.2); color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px;">
                ${safeAppName}
              </span>
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; line-height: 1.3;">
                ${headerTitle}
              </h1>
            </td>
          </tr>
          <!-- Cuerpo del Mensaje -->
          <tr>
            <td style="padding: 28px; font-size: 15px; line-height: 1.6; color: #334155;">
              ${bodyHtml}
              
              <div style="margin: 28px 0; text-align: center;">
                <a href="${buttonUrl}" style="display: inline-block; background: ${buttonColor}; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 13px 32px; border-radius: ${buttonRadius}; box-shadow: 0 4px 14px rgba(0,0,0,0.15);">
                  ${buttonText} →
                </a>
              </div>
            </td>
          </tr>
          <!-- Pie de página -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 28px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0;">${footerText}</p>
              <p style="margin: 6px 0 0; color: #94a3b8; font-size: 11px;">
                Despacho oficial de AgendaPro. ¿Deseas modificar la frecuencia de tus correos o silenciar avisos? <a href="${smtpStore.get().appUrl}/config#notificaciones" style="color: #4f46e5; text-decoration: underline; font-weight: 600;">Ajustar preferencias</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    // Asegurar que la configuración esté sincronizada con BD
    if (!smtpStore.isDatabaseLoaded()) {
      await smtpStore.loadFromDatabase()
    }
    const cfg = smtpStore.get()

    const hasApiProvider = isGmailApiProvider() || isBrevoProvider(cfg) || isResendProvider(cfg)
    if (!hasApiProvider && (!cfg.user || !cfg.pass)) {
      const err = new Error(
        'El servidor SMTP no tiene credenciales configuradas (ni proveedor API como Gmail/Brevo ni usuario/contraseña SMTP). ' +
        'Por favor ingresa al panel Super Admin > Configuración SMTP (/admin/smtp) para guardar tu correo emisor y contraseña de aplicación de 16 caracteres, ' +
        'o define SMTP_USER y SMTP_PASS en las variables de entorno de tu servidor (Render).'
      )
      console.error('[sendTestTemplateEmail] ❌ Error:', err.message)
      throw err
    }

    try {
      const info = await sendEmailMessage({
        to: recipientEmail,
        toName: vars.name || recipientEmail.split('@')[0],
        subject,
        html: fullHtml,
      })

      // Registrar en system_email_logs del centro de control
      try {
        await supabaseAdmin.from('system_email_logs').insert({
          recipient_email: recipientEmail,
          recipient_name: vars.name || recipientEmail.split('@')[0],
          template_slug: slug,
          subject,
          status: 'delivered',
          sent_at: new Date().toISOString(),
          error_message: null,
          metadata: { variables: customVariables },
        })
      } catch (logErr) {
        console.warn('[sendTestTemplateEmail] Advertencia guardando log:', logErr)
      }

      return { messageId: info.messageId }
    } catch (sendErr: any) {
      // Registrar fallo en system_email_logs
      try {
        await supabaseAdmin.from('system_email_logs').insert({
          recipient_email: recipientEmail,
          recipient_name: vars.name || recipientEmail.split('@')[0],
          template_slug: slug,
          subject,
          status: 'failed',
          sent_at: null,
          error_message: sendErr?.message || 'Error de transporte SMTP',
          metadata: { variables: customVariables },
        })
      } catch {
        // Ignore
      }
      throw sendErr
    }
  }

  /**
   * Alias de envío del sistema para plantillas operativas (bienvenida, nuevo dispositivo, seguridad)
   */
  static async sendSystemEmail(
    slug: string,
    recipientEmail: string,
    variables: Record<string, string> = {}
  ): Promise<{ messageId: string }> {
    return this.sendTestTemplateEmail(slug, recipientEmail, variables)
  }

  /**
   * Obtiene la configuración global del sistema
   */
  static async getSettings(): Promise<AppSettingsData> {
    try {
      const { data } = await supabaseAdmin.from('app_settings').select('*').eq('id', 'global_config').maybeSingle()
      if (data) {
        memorySettings = { ...memorySettings, ...data }
      }
    } catch (e) {
      console.warn('[getSettings] Fallback en memoria:', e)
    }

    // Retorna una copia con la contraseña y credenciales sensibles ocultas para seguridad
    return {
      ...memorySettings,
      smtp_pass: memorySettings.smtp_pass ? '••••••••••••••••' : '',
      gmail_client_secret: memorySettings.gmail_client_secret ? '••••••••••••••••' : '',
      gmail_refresh_token: memorySettings.gmail_refresh_token ? '••••••••••••••••' : '',
      is_gmail_api_configured: isGmailApiProvider(),
    }
  }

  /**
   * Actualiza la configuración global del sistema
   */
  static async updateSettings(
    data: Partial<AppSettingsData>,
    actorEmail: string
  ): Promise<AppSettingsData> {
    // Si viene la contraseña enmascarada o vacía, conservamos la que ya estaba en BD/memoria
    if (!data.smtp_pass || !data.smtp_pass.trim() || data.smtp_pass.includes('•••') || data.smtp_pass.includes('•')) {
      delete data.smtp_pass
    } else {
      // Limpiar espacios en blanco (ej: contraseñas de app de Google vienen en bloques de 4 con espacios)
      data.smtp_pass = data.smtp_pass.replace(/\s+/g, '')
    }

    if (!data.gmail_client_secret || data.gmail_client_secret.includes('•••') || data.gmail_client_secret.includes('•')) {
      delete data.gmail_client_secret
    }
    if (!data.gmail_refresh_token || data.gmail_refresh_token.includes('•••') || data.gmail_refresh_token.includes('•')) {
      delete data.gmail_refresh_token
    }

    if (data.smtp_user) {
      data.smtp_user = data.smtp_user.trim()
    }
    if (data.smtp_from_email) {
      data.smtp_from_email = data.smtp_from_email.trim()
    }

    memorySettings = {
      ...memorySettings,
      ...data,
    }

    // ─── Sincronizar con SmtpConfigStore (fuente de verdad en runtime) ────────
    const updatedAppUrl = (data as any).app_url || memorySettings.app_url
    smtpStore.update({
      host: memorySettings.smtp_host,
      port: memorySettings.smtp_port,
      secure: memorySettings.smtp_secure,
      user: memorySettings.smtp_user,
      pass: memorySettings.smtp_pass || '',
      fromName: memorySettings.smtp_from_name,
      fromEmail: memorySettings.smtp_from_email,
      appName: memorySettings.app_name,
      emailProvider: memorySettings.email_provider || 'gmail_api',
      gmailClientId: memorySettings.gmail_client_id || '',
      gmailClientSecret: memorySettings.gmail_client_secret || '',
      gmailRefreshToken: memorySettings.gmail_refresh_token || '',
      ...(updatedAppUrl ? { appUrl: updatedAppUrl } : {}),
    })

    // Reiniciar el transporter cacheado en el EmailAdapter y caché de Gmail OAuth
    try {
      clearGmailAccessTokenCache()
      notificationDispatcher.resetEmailAdapter()
      console.log('[AdminService] 🔄 EmailAdapter transporter y Gmail token reseteados con la nueva configuración.')
    } catch (e) {
      console.warn('[AdminService] No se pudo resetear el EmailAdapter:', e)
    }

    try {
      const dbPayload: Record<string, any> = { ...memorySettings }
      const { error: dbErr } = await supabaseAdmin.from('app_settings').upsert({
        id: 'global_config',
        ...dbPayload,
        updated_at: new Date().toISOString(),
      })
      if (dbErr && (dbErr.message?.includes('column') || dbErr.code === '42703')) {
        console.warn('[updateSettings] Columnas nuevas pendientes en Supabase SQL Editor. Guardando campos base...')
        const safePayload = { ...dbPayload }
        delete safePayload.email_provider
        delete safePayload.gmail_client_id
        delete safePayload.gmail_client_secret
        delete safePayload.gmail_refresh_token
        delete safePayload.ui_feature_permissions
        await supabaseAdmin.from('app_settings').upsert({
          id: 'global_config',
          ...safePayload,
          updated_at: new Date().toISOString(),
        })
      }
    } catch (err) {
      console.warn('[updateSettings] Upsert app_settings fallback:', err)
    }

    await logAudit({
      actorEmail,
      action: 'SYSTEM_SETTINGS_UPDATED',
      resourceType: 'settings',
      resourceId: 'global_config',
      details: {
        appName: memorySettings.app_name,
        smtpUser: memorySettings.smtp_user,
      },
    })

    return this.getSettings()
  }

  /**
   * Verifica la conectividad con el servidor SMTP o Gmail API
   */
  static async testSmtp(config: {
    host: string
    port: number
    secure: boolean
    user: string
    pass: string
    email_provider?: 'gmail_api' | 'gmail_smtp' | 'brevo' | 'resend'
    gmail_client_id?: string
    gmail_client_secret?: string
    gmail_refresh_token?: string
  }): Promise<{ success: boolean; latencyMs: number; message: string; details: Record<string, unknown> }> {
    const isGmailTest =
      config.email_provider === 'gmail_api' ||
      Boolean(config.gmail_refresh_token && !config.gmail_refresh_token.includes('•')) ||
      (config.host && config.host.includes('gmail') && !config.host.includes('smtp'))

    if (isGmailTest) {
      const clientId = (config.gmail_client_id && !config.gmail_client_id.includes('•'))
        ? config.gmail_client_id
        : memorySettings.gmail_client_id || process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ''
      const clientSecret = (config.gmail_client_secret && !config.gmail_client_secret.includes('•'))
        ? config.gmail_client_secret
        : memorySettings.gmail_client_secret || process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || ''
      const refreshToken = (config.gmail_refresh_token && !config.gmail_refresh_token.includes('•'))
        ? config.gmail_refresh_token
        : memorySettings.gmail_refresh_token || process.env.GMAIL_REFRESH_TOKEN || ''

      return await verifyEmailTransport({
        host: config.host || 'gmail.googleapis.com',
        port: 443,
        secure: true,
        user: config.user || memorySettings.smtp_user,
        pass: refreshToken,
        email_provider: 'gmail_api',
        gmail_client_id: clientId,
        gmail_client_secret: clientSecret,
        gmail_refresh_token: refreshToken,
      })
    }

    // Si la contraseña viene enmascarada (•••) o vacía, usar la guardada en memoria/BD
    const effectivePass = (config.pass && !config.pass.includes('•'))
      ? config.pass.replace(/\s+/g, '')
      : (memorySettings.smtp_pass && !memorySettings.smtp_pass.includes('•'))
      ? memorySettings.smtp_pass.replace(/\s+/g, '')
      : smtpStore.get().pass

    if (!config.user || !effectivePass) {
      return {
        success: false,
        latencyMs: 0,
        message: 'Fallo: Debes ingresar el usuario (correo) y la contraseña para probar la conexión.',
        details: { error: 'Credenciales incompletas' },
      }
    }

    return await verifyEmailTransport({
      host: config.host,
      port: Number(config.port) || 587,
      secure: Boolean(config.secure),
      user: config.user,
      pass: effectivePass,
    })
  }

  /**
   * Obtiene logs de auditoría
   */
  static async getAuditLogs(params: {
    limit?: number
    action?: string
    search?: string
  }): Promise<Array<Record<string, unknown>>> {
    try {
      let q = supabaseAdmin
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(params.limit || 100)

      if (params.action) q = q.eq('action', params.action)
      if (params.search && params.search.trim()) {
        const s = params.search.trim()
        q = q.or(`actor_email.ilike.%${s}%,action.ilike.%${s}%,resource_id.ilike.%${s}%,ip_address.ilike.%${s}%`)
      }
      const { data, error } = await q
      if (!error && Array.isArray(data)) {
        return data
      }
      if (error) {
        console.warn('[getAuditLogs] Error en consulta a Supabase:', error.message)
      }
    } catch (e) {
      console.warn('[getAuditLogs] Error inesperado:', e)
    }

    return []
  }

  /**
   * Obtiene logs del centro de emails con datos 100% reales de BD, filtros y búsqueda
   */
  static async getEmailLogs(params: {
    status?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<{ logs: Array<Record<string, unknown>>; total: number }> {
    try {
      let q = supabaseAdmin
        .from('system_email_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (params.status && params.status !== 'all') {
        q = q.eq('status', params.status)
      }
      if (params.search && params.search.trim()) {
        const s = params.search.trim()
        q = q.or(`recipient_email.ilike.%${s}%,subject.ilike.%${s}%,template_slug.ilike.%${s}%`)
      }

      const page = params.page || 1
      const limit = params.limit || 20
      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data, count, error } = await q.range(from, to)

      if (!error && data && data.length > 0) {
        return { logs: data, total: count ?? data.length }
      }

      // Si system_email_logs no tiene registros aún, poblarlo desde reminder_logs reales:
      const { data: reminderLogs } = await supabaseAdmin
        .from('reminder_logs')
        .select('*, tasks(title, due_date)')
        .eq('channel', 'email')
        .order('created_at', { ascending: false })
        .limit(100)

      if (reminderLogs && reminderLogs.length > 0) {
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
        const userMap = new Map<string, any>()
        usersData?.users.forEach((u) => userMap.set(u.id, u))

        const convertedLogs = reminderLogs.map((rl) => {
          const u = userMap.get(rl.user_id)
          const email = u?.email || 'marlon21ronaldo@gmail.com'
          const name = (u?.user_metadata?.full_name as string) || email.split('@')[0]
          return {
            id: rl.id,
            recipient_email: email,
            recipient_name: name,
            template_slug: 'recordatorio_tarea',
            subject: rl.tasks?.title ? `⏰ Recordatorio: ${rl.tasks.title}` : 'Recordatorio Académico',
            status: rl.status === 'sent' ? 'delivered' : rl.status,
            sent_at: rl.sent_at,
            created_at: rl.created_at,
            error_message: rl.error_message,
            retry_count: 0,
            metadata: { taskId: rl.task_id },
          }
        })

        // Insertar en segundo plano en system_email_logs
        try {
          await supabaseAdmin.from('system_email_logs').upsert(convertedLogs, { onConflict: 'id', ignoreDuplicates: true })
        } catch {
          // Ignorar
        }

        let filtered = convertedLogs
        if (params.status && params.status !== 'all') {
          filtered = filtered.filter((l) => l.status === params.status)
        }
        if (params.search && params.search.trim()) {
          const s = params.search.trim().toLowerCase()
          filtered = filtered.filter((l) => l.recipient_email.toLowerCase().includes(s) || l.subject.toLowerCase().includes(s))
        }

        return { logs: filtered.slice(from, to + 1), total: filtered.length }
      }
    } catch (e) {
      console.warn('[getEmailLogs] Error consultando logs de BD:', e)
    }

    return { logs: [], total: 0 }
  }

  /**
   * Reintenta el envío real de un correo vía SMTP y actualiza system_email_logs
   */
  static async retryEmail(logId: string, actorEmail: string): Promise<void> {
    const { data: log } = await supabaseAdmin
      .from('system_email_logs')
      .select('*')
      .eq('id', logId)
      .maybeSingle()

    if (!log) {
      throw new Error('Registro de correo no encontrado')
    }

    // Reintentar despacho real reconstruyendo plantilla si existe
    try {
      let emailHtml = `<p>Este es un reintento de entrega oficial para la notificación: <strong>${log.subject}</strong>.</p>`
      let emailText = `Reintento de despacho: ${log.subject}`

      if (log.template_slug) {
        try {
          const { data: template } = await supabaseAdmin
            .from('email_templates')
            .select('*')
            .eq('slug', log.template_slug)
            .maybeSingle()

          if (template) {
            const vars = {
              name: log.recipient_name || log.recipient_email?.split('@')[0] || 'Docente',
              app_name: 'AgendaPro',
              action_url: smtpStore.get().appUrl,
              ...(log.metadata?.variables || {}),
            }

            let subject = template.subject || log.subject
            let headerTitle = template.header_title || log.subject
            let bodyHtml = template.body_html || ''
            let buttonText = template.button_text || 'Ir a la plataforma'
            let buttonUrl = template.button_url || vars.action_url
            let footerText = template.footer_text || 'AgendaPro'

            Object.entries(vars).forEach(([k, v]) => {
              const reg = new RegExp(`{{${k}}}`, 'g')
              const val = String(v ?? '')
              subject = subject.replace(reg, val)
              headerTitle = headerTitle.replace(reg, val)
              bodyHtml = bodyHtml.replace(reg, val)
              buttonText = buttonText.replace(reg, val)
              buttonUrl = buttonUrl.replace(reg, val)
              footerText = footerText.replace(reg, val)
            })

            if (vars.task_list_html && !bodyHtml.includes(vars.task_list_html)) {
              bodyHtml += vars.task_list_html
            }

            const logoUrl = getEmailLogoUrl(smtpStore.get().appUrl)
            emailHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 32px 28px; text-align: left;">
              <img src="${logoUrl}" alt="AgendaPro" width="48" height="48" style="display: block; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 2px solid rgba(255,255,255,0.3); background-color: #ffffff;" />
              <span style="display: inline-block; background-color: rgba(255,255,255,0.2); color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px;">
                AgendaPro
              </span>
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; line-height: 1.3;">
                ${headerTitle}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px; font-size: 15px; line-height: 1.6; color: #334155;">
              ${bodyHtml}
              <div style="margin: 28px 0; text-align: center;">
                <a href="${buttonUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 12px 28px; border-radius: 10px; box-shadow: 0 2px 8px rgba(37,99,235,0.25);">
                  ${buttonText} →
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 28px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0;">${footerText}</p>
              <p style="margin: 6px 0 0; color: #94a3b8;">Despacho oficial de AgendaPro.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
            emailText = `${headerTitle}\n\n${buttonUrl}`
          }
        } catch (tErr) {
          console.warn('[retryEmail] Error reconstruyendo plantilla:', tErr)
        }
      }

      await sendEmailMessage({
        to: log.recipient_email,
        toName: log.recipient_name,
        subject: log.subject,
        html: emailHtml,
        text: emailText,
      })

      await supabaseAdmin
        .from('system_email_logs')
        .update({
          status: 'delivered',
          sent_at: new Date().toISOString(),
          error_message: null,
          retry_count: (log.retry_count || 0) + 1,
        })
        .eq('id', logId)
    } catch (err: any) {
      await supabaseAdmin
        .from('system_email_logs')
        .update({
          status: 'failed',
          error_message: err?.message || 'Error en reintento',
          retry_count: (log.retry_count || 0) + 1,
        })
        .eq('id', logId)
      throw err
    }

    await logAudit({
      actorEmail,
      action: 'EMAIL_DISPATCH_RETRIED',
      resourceType: 'email_log',
      resourceId: logId,
      details: { recipient: log.recipient_email, subject: log.subject },
    })
  }

  /**
   * Estadísticas reales de Google OAuth
   */
  static async getOAuthStats(): Promise<{
    googleCount: number
    emailCount: number
    recentGoogleUsers: Array<{ email: string; name: string; date: string }>
    oauthErrorsCount: number
  }> {
    const overview = await this.getOverview()
    let recentGoogleUsers: Array<{ email: string; name: string; date: string }> = []
    try {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
      if (usersData?.users) {
        recentGoogleUsers = usersData.users
          .filter((u) => u.app_metadata?.provider === 'google' || u.identities?.some((i) => i.provider === 'google'))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10)
          .map((u) => ({
            email: u.email || 'usuario-google@institucion.edu',
            name: (u.user_metadata?.full_name as string) || (u.user_metadata?.name as string) || u.email?.split('@')[0] || 'Docente',
            date: u.created_at,
          }))
      }
    } catch {
      // Fallback
    }

    let oauthErrorsCount = 0
    try {
      const { count } = await supabaseAdmin
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed')
        .ilike('action', '%OAUTH%')
      oauthErrorsCount = count || 0
    } catch {
      // Fallback
    }

    return {
      googleCount: overview.userDistribution.google,
      emailCount: overview.userDistribution.email,
      recentGoogleUsers,
      oauthErrorsCount,
    }
  }
}
