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

      // 2. Despacho dinámico de Daily y Weekly Digest según horario de cada usuario
      const now = new Date()
      const localHour = parseInt(
        new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guatemala', hour: 'numeric', hour12: false }).format(now),
        10
      )
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const currentDay = dayNames[now.getDay()]

      const digestStats = await notificationDispatcher.dispatchDailyDigests({ currentHour: localHour })
      if (digestStats.sent > 0 || digestStats.failed > 0) {
        console.log(
          `☀️ [ReminderScheduler] Daily Digest (hora ${localHour}:00): ${digestStats.sent} enviado(s), ${digestStats.failed} fallido(s).`
        )
      }

      const weeklyStats = await notificationDispatcher.dispatchWeeklyDigests({ currentHour: localHour, currentDay })
      if (weeklyStats.sent > 0 || weeklyStats.failed > 0) {
        console.log(
          `📅 [ReminderScheduler] Weekly Digest (${currentDay} ${localHour}:00): ${weeklyStats.sent} enviado(s), ${weeklyStats.failed} fallido(s).`
        )
      }
    } catch (err) {
      console.error('❌ [ReminderScheduler] Error durante el ciclo de recordatorios/digest:', err)
    } finally {
      this.isRunning = false
    }
  }
}

export const reminderScheduler = new ReminderScheduler()
