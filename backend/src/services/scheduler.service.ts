import { notificationDispatcher } from './dispatcher/notification.dispatcher'

/**
 * Servicio de planificación periódica para despachar recordatorios académicos en segundo plano.
 * Escanea la base de datos cada 30 segundos para evaluar vencimientos y disparar alertas puntuales.
 */
class ReminderScheduler {
  private timer: NodeJS.Timeout | null = null
  private isRunning = false

  /**
   * Inicia el ciclo en segundo plano (por defecto cada 30 segundos)
   */
  public start(intervalMs = 30000): void {
    if (this.timer) {
      console.log('⚠️  [ReminderScheduler] El planificador ya está en ejecución.')
      return
    }

    console.log(`⏱️  [ReminderScheduler] Planificador automático activado (escaneo cada ${intervalMs / 1000}s).`)

    // Ejecución inmediata inicial al arrancar
    this.runJob()

    // Ciclo recurrente
    this.timer = setInterval(() => {
      this.runJob()
    }, intervalMs)
  }

  private lastDigestDate: string | null = null

  /**
   * Detiene el planificador limpiamente
   */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
      console.log('🛑  [ReminderScheduler] Planificador automático detenido.')
    }
  }

  /**
   * Ejecuta una ronda de despacho de recordatorios y evaluación de daily digest
   */
  public async runJob(): Promise<void> {
    if (this.isRunning) {
      return // Evitar ejecuciones simultáneas si un ciclo previo aún no finaliza
    }

    this.isRunning = true
    try {
      // 1. Despacho de alertas de anticipación por tarea
      const stats = await notificationDispatcher.dispatchUpcomingReminders()
      if (stats.sent > 0 || stats.failed > 0) {
        console.log(
          `🔔 [ReminderScheduler] Ciclo completado: ${stats.sent} enviado(s), ${stats.failed} fallido(s) de ${stats.processed} evaluado(s).`
        )
      }

      // 2. Joya 4: Daily Academic Digest Automático a las 7:00 AM (Zona America/Guatemala UTC-6)
      const now = new Date()
      const localDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala' }).format(now)
      const localHour = parseInt(
        new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guatemala', hour: 'numeric', hour12: false }).format(now),
        10
      )

      if (localHour >= 7 && this.lastDigestDate !== localDateStr) {
        this.lastDigestDate = localDateStr
        console.log(`🌅 [ReminderScheduler] Iniciando evaluación del Daily Academic Digest para la fecha ${localDateStr}...`)
        const digestStats = await notificationDispatcher.dispatchDailyDigests()
        if (digestStats.sent > 0 || digestStats.failed > 0) {
          console.log(
            `☀️ [ReminderScheduler] Daily Digest completado: ${digestStats.sent} enviado(s), ${digestStats.failed} fallido(s) de ${digestStats.processed} evaluado(s).`
          )
        }
      }
    } catch (err) {
      console.error('❌ [ReminderScheduler] Error durante el ciclo de recordatorios/digest:', err)
    } finally {
      this.isRunning = false
    }
  }
}

export const reminderScheduler = new ReminderScheduler()
