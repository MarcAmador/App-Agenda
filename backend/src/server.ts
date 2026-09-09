import dns from 'dns'
dns.setDefaultResultOrder('ipv4first')

import { app } from './app'
import { env } from './config/env'
import { reminderScheduler } from './services/scheduler.service'
import { smtpStore } from './config/smtpStore'
import { supabaseAdmin } from './config/supabase'

const PORT = parseInt(env.PORT, 10)

/**
 * Carga la configuración SMTP desde Supabase al arrancar el servidor.
 * Esto garantiza que si el SuperAdmin guardó cambios, se aplican al reiniciar.
 */
async function initSmtpFromDatabase(): Promise<void> {
  try {
    const { data } = await supabaseAdmin
      .from('app_settings')
      .select('smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, smtp_from_name, smtp_from_email, app_name')
      .eq('id', 'global_config')
      .maybeSingle()

    if (data && data.smtp_user) {
      smtpStore.update({
        host: data.smtp_host || env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(data.smtp_port) || 587,
        secure: Boolean(data.smtp_secure),
        user: data.smtp_user,
        pass: (data.smtp_pass || '').replace(/\s+/g, ''),
        fromName: data.smtp_from_name || 'AgendaPro Académico',
        fromEmail: data.smtp_from_email || data.smtp_user,
        appName: data.app_name || 'AgendaPro Académico',
        // La URL de la app viene del env (CORS_ORIGIN es la URL del frontend)
        appUrl: env.CORS_ORIGIN || 'http://localhost:5180',
      })
      console.log(`📧  SMTP cargado desde BD → Emisor: ${data.smtp_user}`)
    } else if (env.SMTP_USER) {
      // Fallback: usar env si no hay config en BD
      smtpStore.update({
        user: env.SMTP_USER,
        pass: (env.SMTP_PASS || '').replace(/\s+/g, ''),
        host: env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(env.SMTP_PORT) || 587,
        fromEmail: env.SMTP_USER,
        appUrl: env.CORS_ORIGIN || 'http://localhost:5180',
      })
      console.log(`📧  SMTP cargado desde .env → Emisor: ${env.SMTP_USER}`)
    } else {
      console.warn('⚠️  Sin configuración SMTP. Los correos usarán Ethereal (modo demo).')
    }
  } catch (err) {
    console.warn('⚠️  No se pudo cargar SMTP desde BD, usando .env como fallback:', err)
    if (env.SMTP_USER) {
      smtpStore.update({
        user: env.SMTP_USER,
        pass: (env.SMTP_PASS || '').replace(/\s+/g, ''),
        host: env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(env.SMTP_PORT) || 587,
        fromEmail: env.SMTP_USER,
        appUrl: env.CORS_ORIGIN || 'http://localhost:5180',
      })
    }
  }
}

const server = app.listen(PORT, async () => {
  console.log(`\n🚀  Backend AgendaPro corriendo en http://localhost:${PORT}`)
  console.log(`   Entorno:    ${env.NODE_ENV}`)
  console.log(`   CORS:       ${env.CORS_ORIGIN}`)
  console.log(`   Health:     http://localhost:${PORT}/health\n`)

  // Cargar configuración SMTP desde Supabase antes de iniciar el scheduler
  await initSmtpFromDatabase()

  // Iniciar planificador automático de recordatorios en segundo plano
  reminderScheduler.start(30000)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM recibido — cerrando servidor...')
  reminderScheduler.stop()
  server.close(() => {
    console.log('✅  Servidor cerrado limpiamente.')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT recibido — cerrando servidor...')
  reminderScheduler.stop()
  server.close(() => {
    console.log('✅  Servidor cerrado limpiamente.')
    process.exit(0)
  })
})

