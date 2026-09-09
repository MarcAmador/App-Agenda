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
   * Ejecuta una ronda de despacho de recordatorios
   */
  public async runJob(): Promise<void> {
    if (this.isRunning) {
      return // Evitar ejecuciones simultáneas si un ciclo previo aún no finaliza
    }

    this.isRunning = true
    try {
      const stats = await notificationDispatcher.dispatchUpcomingReminders()
      if (stats.sent > 0 || stats.failed > 0) {
        console.log(
          `🔔 [ReminderScheduler] Ciclo completado: ${stats.sent} enviado(s), ${stats.failed} fallido(s) de ${stats.processed} evaluado(s).`
        )
      }
    } catch (err) {
      console.error('❌ [ReminderScheduler] Error durante el ciclo de recordatorios:', err)
    } finally {
      this.isRunning = false
    }
  }
}

export const reminderScheduler = new ReminderScheduler()
