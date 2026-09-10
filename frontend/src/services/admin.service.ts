import { supabase } from '@/lib/supabaseClient'

const getBackendUrl = () => {
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'
}

/**
 * Obtiene los headers con el Bearer Token activo de Supabase Auth
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || ''
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export interface AdminUser {
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

export interface EmailTemplate {
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
  updated_at?: string
}

export interface AppSettings {
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
}

export interface AdminOverview {
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
  recentActivity: Array<{
    id: string
    action: string
    actor_name: string
    actor_email: string
    resource_type: string
    status: string
    created_at: string
    details?: Record<string, unknown>
  }>
  alerts: Array<{
    id: string
    type: 'error' | 'warning' | 'info'
    title: string
    message: string
    timestamp: string
  }>
}

export const adminService = {
  /**
   * Consulta pública de ajustes visuales (para banner global en el Dashboard)
   */
  async getPublicSettings(): Promise<Partial<AppSettings>> {
    try {
      const res = await fetch(`${getBackendUrl()}/api/v1/admin/public-settings`)
      if (!res.ok) return {}
      return await res.json()
    } catch {
      return {}
    }
  },

  /**
   * Métricas generales para el dashboard de administración
   */
  async getOverview(): Promise<AdminOverview> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${getBackendUrl()}/api/v1/admin/overview`, { headers })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Error al obtener métricas del sistema')
    }
    return res.json()
  },

  /**
   * Listado de usuarios con filtros y paginación
   */
  async getUsers(params: {
    page?: number
    limit?: number
    search?: string
    role?: string
    status?: string
  } = {}): Promise<{ users: AdminUser[]; total: number }> {
    const headers = await getAuthHeaders()
    const query = new URLSearchParams()
    if (params.page) query.set('page', String(params.page))
    if (params.limit) query.set('limit', String(params.limit))
    if (params.search) query.set('search', params.search)
    if (params.role) query.set('role', params.role)
    if (params.status) query.set('status', params.status)

    const res = await fetch(`${getBackendUrl()}/api/v1/admin/users?${query.toString()}`, { headers })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Error al obtener usuarios')
    }
    return res.json()
  },

  /**
   * Actualiza el rol de un usuario (Super Admin, Admin, Support, User)
   */
  async updateUserRole(id: string, role: string): Promise<void> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${getBackendUrl()}/api/v1/admin/users/${id}/role`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ role }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Error al cambiar rol')
    }
  },

  /**
   * Suspende o reactiva un usuario
   */
  async updateUserStatus(id: string, status: 'active' | 'suspended'): Promise<void> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${getBackendUrl()}/api/v1/admin/users/${id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Error al cambiar estado')
    }
  },

  /**
   * Cierra las sesiones remotas de un usuario
   */
  async resetUserSessions(id: string): Promise<void> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${getBackendUrl()}/api/v1/admin/users/${id}/reset-sessions`, {
      method: 'POST',
      headers,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Error al cerrar sesiones')
    }
  },

  /**
   * Elimina un usuario de forma definitiva
   */
  async deleteUser(id: string): Promise<void> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${getBackendUrl()}/api/v1/admin/users/${id}`, {
      method: 'DELETE',
      headers,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Error al eliminar usuario')
    }
  },

  /**
   * Obtiene la lista de las 9 plantillas de email
   */
  async getTemplates(): Promise<EmailTemplate[]> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${getBackendUrl()}/api/v1/admin/templates`, { headers })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Error al obtener plantillas')
    }
    return res.json()
  },

  /**
   * Actualiza el contenido de una plantilla de email
   */
  async updateTemplate(slug: string, data: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${getBackendUrl()}/api/v1/admin/templates/${slug}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Error al guardar plantilla')
    }
    const json = await res.json()
    return json.template
  },

  /**
   * Envía un correo real de prueba renderizando la plantilla
   */
  async sendTestTemplate(slug: string, recipientEmail: string, customVariables: Record<string, string> = {}): Promise<void> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${getBackendUrl()}/api/v1/admin/templates/${slug}/test`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ recipientEmail, customVariables }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Error al enviar correo de prueba')
    }
  },

  /**
   * Obtiene los logs de despacho de correo
   */
  async getEmailLogs(params: { status?: string; search?: string; page?: number; limit?: number } = {}): Promise<{
    logs: Array<Record<string, unknown>>
    total: number
  }> {
    const headers = await getAuthHeaders()
    const query = new URLSearchParams()
    if (params.status) query.set('status', params.status)
    if (params.search) query.set('search', params.search)
    if (params.page) query.set('page', String(params.page))
    if (params.limit) query.set('limit', String(params.limit))

    const res = await fetch(`${getBackendUrl()}/api/v1/admin/emails?${query.toString()}`, { headers })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Error al obtener logs de correo')
    }
    return res.json()
  },

  /**
   * Reintenta el envío de un correo fallido
   */
  async retryEmail(logId: string): Promise<void> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${getBackendUrl()}/api/v1/admin/emails/${logId}/retry`, {
      method: 'POST',
      headers,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Error al reintentar correo')
    }
  },

  /**
   * Obtiene la configuración global del sistema
   */
  async getSettings(): Promise<AppSettings> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${getBackendUrl()}/api/v1/admin/settings`, { headers })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Error al obtener configuración')
    }
    return res.json()
  },

  /**
   * Guarda cambios en la configuración global
   */
  async updateSettings(data: Partial<AppSettings>): Promise<AppSettings> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${getBackendUrl()}/api/v1/admin/settings`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Error al guardar configuración')
    }
    const json = await res.json()
    return json.settings
  },

  /**
   * Diagnóstico de conexión con el servidor SMTP dedicado
   */
  async testSmtp(config: {
    host: string
    port: number
    secure: boolean
    user: string
    pass: string
  }): Promise<{ success: boolean; latencyMs: number; message: string; details: Record<string, unknown> }> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${getBackendUrl()}/api/v1/admin/settings/test-smtp`, {
      method: 'POST',
      headers,
      body: JSON.stringify(config),
    })
    const json = await res.json()
    if (!res.ok) {
      throw new Error(json.message || 'Fallo de prueba SMTP')
    }
    return json
  },

  /**
   * Consulta de registros de auditoría
   */
  async getAuditLogs(params: { limit?: number; action?: string; search?: string } = {}): Promise<Array<Record<string, unknown>>> {
    const headers = await getAuthHeaders()
    const query = new URLSearchParams()
    if (params.limit) query.set('limit', String(params.limit))
    if (params.action) query.set('action', params.action)
    if (params.search) query.set('search', params.search)

    const res = await fetch(`${getBackendUrl()}/api/v1/admin/audit-logs?${query.toString()}`, { headers })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Error al obtener logs de auditoría')
    }
    return res.json()
  },

  /**
   * Estadísticas de Google OAuth
   */
  async getOAuthStats(): Promise<{
    googleCount: number
    emailCount: number
    recentGoogleUsers: Array<{ email: string; name: string; date: string }>
    oauthErrorsCount: number
  }> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${getBackendUrl()}/api/v1/admin/oauth-stats`, { headers })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Error al obtener estadísticas de Google OAuth')
    }
    return res.json()
  },
}
