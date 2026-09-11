/**
 * ─── SmtpConfigStore ──────────────────────────────────────────────────────────
 * Fuente de verdad ÚNICA para la configuración SMTP en tiempo de ejecución.
 * • Se inicializa con las variables de entorno (.env) como fallback seguro.
 * • Se recarga desde la tabla `app_settings` de Supabase al arrancar el servidor.
 * • Cuando el SuperAdmin guarda cambios, llama a `SmtpConfigStore.update()` para
 *   que todos los servicios (EmailAdapter, sendTestTemplateEmail, etc.) reflejen
 *   los cambios de forma INMEDIATA sin reiniciar el servidor.
 */

import { supabaseAdmin } from './supabase'

export interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  fromName: string
  fromEmail: string
  /** URL pública del frontend para los botones en los correos */
  appUrl: string
  appName: string
}

class SmtpConfigStore {
  private config: SmtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: (process.env.SMTP_PASS || '').replace(/\s+/g, ''),
    fromName: 'AgendaPro Académico',
    fromEmail: process.env.SMTP_USER || '',
    appUrl: (process.env.FRONTEND_URL || process.env.APP_URL || process.env.CORS_ORIGIN || 'http://localhost:5180').replace(/\/$/, ''),
    appName: 'AgendaPro Académico',
  }

  private isLoaded = false

  /**
   * Auto-detecta la URL pública del frontend si la petición proviene de un dominio de producción real (ej: Vercel)
   */
  autoDetectAppUrl(origin?: string): void {
    if (!origin || typeof origin !== 'string') return
    try {
      const parsed = new URL(origin)
      const clean = `${parsed.protocol}//${parsed.host}`
      if (!clean.includes('localhost') && !clean.includes('127.0.0.1')) {
        if (this.config.appUrl !== clean) {
          this.config.appUrl = clean
          console.log(`[SmtpConfigStore] 🌐 URL pública auto-detectada desde tráfico web → ${clean}`)
        }
      }
    } catch {
      // Ignorar errores de URL malformada
    }
  }

  /** Carga la configuración directamente desde Supabase `app_settings` */
  async loadFromDatabase(): Promise<void> {
    try {
      const { data, error } = await supabaseAdmin
        .from('app_settings')
        .select('*')
        .eq('id', 'global_config')
        .maybeSingle()

      if (error) {
        console.warn('[SmtpConfigStore] Advertencia al consultar app_settings:', error.message)
      }

      if (data && (data as any).smtp_user) {
        const effectivePass = ((data as any).smtp_pass && (data as any).smtp_pass.trim())
          ? (data as any).smtp_pass.replace(/\s+/g, '')
          : this.config.pass

        this.update({
          host: (data as any).smtp_host || this.config.host,
          port: Number((data as any).smtp_port) || this.config.port,
          secure: Boolean((data as any).smtp_secure),
          user: (data as any).smtp_user,
          pass: effectivePass,
          fromName:
            (data as any).smtp_from_name && !(data as any).smtp_from_name.toLowerCase().includes('nivora')
              ? (data as any).smtp_from_name
              : 'AgendaPro Académico',
          fromEmail: (data as any).smtp_from_email || (data as any).smtp_user,
          appName:
            (data as any).app_name && !(data as any).app_name.toLowerCase().includes('nivora')
              ? (data as any).app_name
              : this.config.appName,
          ...((data as any).app_url ? { appUrl: (data as any).app_url.replace(/\/$/, '') } : {}),
        })
        this.isLoaded = true
        console.log(`[SmtpConfigStore] 📧 Configuración cargada desde BD → Emisor: ${(data as any).smtp_user}`)
      }
    } catch (err) {
      console.warn('[SmtpConfigStore] Advertencia al sincronizar con BD:', err)
    }
  }

  isDatabaseLoaded(): boolean {
    return this.isLoaded
  }

  /** Devuelve una copia inmutable de la configuración actual */
  get(): Readonly<SmtpConfig> {
    return { ...this.config }
  }

  /** Actualiza parcialmente la configuración (llamado desde AdminService.updateSettings) */
  update(partial: Partial<SmtpConfig>): void {
    if (partial.pass) {
      partial.pass = partial.pass.replace(/\s+/g, '')
    }
    this.config = { ...this.config, ...partial }
    this.isLoaded = true
    console.log(`[SmtpConfigStore] ✅ Configuración actualizada → Emisor: ${this.config.user} | Host: ${this.config.host}:${this.config.port}`)
  }

  /** ¿Tiene credenciales SMTP reales configuradas? */
  hasCredentials(): boolean {
    return Boolean(this.config.user && this.config.pass)
  }
}

/** Instancia singleton exportada — importar esto en cualquier servicio */
export const smtpStore = new SmtpConfigStore()
