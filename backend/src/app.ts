import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { env } from './config/env'
import { errorHandler } from './middlewares/error.middleware'
import { authRouter } from './routes/auth.routes'
import { tasksRouter } from './routes/tasks.routes'
import { preferencesRouter } from './routes/preferences.routes'
import { remindersRouter } from './routes/reminders.routes'
import { adminRouter } from './routes/admin.routes'

const app = express()

// ─── Seguridad HTTP ───────────────────────────────────────────────────────────
app.use(helmet())

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || origin === env.CORS_ORIGIN) {
      callback(null, true)
    } else {
      callback(null, true)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
}))

// ─── Rate Limiting global ────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 200,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Por favor, intenta más tarde.' },
})
app.use(limiter)

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

// ─── Rutas de la API v1 ──────────────────────────────────────────────────────
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/tasks', tasksRouter)
app.use('/api/v1/preferences', preferencesRouter)
app.use('/api/v1/reminders', remindersRouter)
app.use('/api/v1/admin', adminRouter)


// ─── Manejo de rutas no encontradas ─────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

// ─── Manejador centralizado de errores (siempre al final) ────────────────────
app.use(errorHandler)

export { app }
