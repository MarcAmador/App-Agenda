import { app } from './app'
import { env } from './config/env'

const PORT = parseInt(env.PORT, 10)

const server = app.listen(PORT, () => {
  console.log(`\n🚀  Backend AgendaPro corriendo en http://localhost:${PORT}`)
  console.log(`   Entorno:    ${env.NODE_ENV}`)
  console.log(`   CORS:       ${env.CORS_ORIGIN}`)
  console.log(`   Health:     http://localhost:${PORT}/health\n`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM recibido — cerrando servidor...')
  server.close(() => {
    console.log('✅  Servidor cerrado limpiamente.')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT recibido — cerrando servidor...')
  server.close(() => {
    console.log('✅  Servidor cerrado limpiamente.')
    process.exit(0)
  })
})
