import './config/network'

import { app } from './app'
import { env } from './config/env'
import { reminderScheduler } from './services/scheduler.service'
import { smtpStore } from './config/smtpStore'

const PORT = parseInt(env.PORT, 10)

/**
 * Carga la configuración SMTP desde Supabase al arrancar el servidor.
 * Esto garantiza que si el SuperAdmin guardó cambios, se aplican al reiniciar.
 */
async function initSmtpFromDatabase(): Promise<void> {
  try {
    await smtpStore.loadFromDatabase()
    if (smtpStore.hasCredentials()) {
      console.log(`📧  SMTP activo → Emisor: ${smtpStore.get().user}`)
    } else {
      console.warn('⚠️  Sin credenciales SMTP configuradas. Los correos usarán Ethereal (modo demo).')
    }
  } catch (err) {
    console.warn('⚠️  Error al sincronizar SMTP con BD:', err)
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

