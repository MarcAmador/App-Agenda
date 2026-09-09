import dns from 'dns'
dns.setDefaultResultOrder('ipv4first')

import { app } from './app'
import { env } from './config/env'
import { reminderScheduler } from './services/scheduler.service'

const PORT = parseInt(env.PORT, 10)

const server = app.listen(PORT, () => {
  console.log(`\n🚀  Backend AgendaPro corriendo en http://localhost:${PORT}`)
  console.log(`   Entorno:    ${env.NODE_ENV}`)
  console.log(`   CORS:       ${env.CORS_ORIGIN}`)
  console.log(`   Health:     http://localhost:${PORT}/health\n`)

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
