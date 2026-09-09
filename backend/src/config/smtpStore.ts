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
    appUrl: process.env.CORS_ORIGIN || process.env.VITE_FRONTEND_URL || 'http://localhost:5180',
    appName: 'AgendaPro Académico',
  }

  private isLoaded = false

  /** Carga la configuración directamente desde Supabase `app_settings` */
  async loadFromDatabase(): Promise<void> {
    try {
      const { data } = await supabaseAdmin
        .from('app_settings')
        .select('smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, smtp_from_name, smtp_from_email, app_name')
        .eq('id', 'global_config')
        .maybeSingle()

      if (data && data.smtp_user) {
        this.update({
          host: data.smtp_host || this.config.host,
          port: Number(data.smtp_port) || this.config.port,
          secure: Boolean(data.smtp_secure),
          user: data.smtp_user,
          pass: (data.smtp_pass || '').replace(/\s+/g, ''),
          fromName: data.smtp_from_name || 'AgendaPro Académico',
          fromEmail: data.smtp_from_email || data.smtp_user,
          appName: data.app_name || this.config.appName,
        })
        this.isLoaded = true
        console.log(`[SmtpConfigStore] 📧 Configuración cargada desde BD → Emisor: ${data.smtp_user}`)
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
