/**
 * Motor de Efectos de Sonido Sintetizados con Web Audio API.
 * 100% nativo, sin dependencias externas ni descargas de archivos mp3/wav.
 * Respuesta acústica inmediata en cualquier navegador moderno.
 */

class SoundEngine {
  private ctx: AudioContext | null = null
  private isMuted: boolean = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.isMuted = localStorage.getItem('agendapro_sound_muted') === 'true'
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted
    if (typeof window !== 'undefined') {
      localStorage.setItem('agendapro_sound_muted', String(this.isMuted))
      window.dispatchEvent(
        new CustomEvent('agendapro_sound_toggle', { detail: { isMuted: this.isMuted } })
      )
    }
    return this.isMuted
  }

  public getMuted(): boolean {
    return this.isMuted
  }

  /**
   * Chime armónico de éxito al completar una tarea o subtarea
   * Secuencia melódica brillante (E6 -> A6) con caída suave
   */
  public playSuccessChime(): void {
    if (this.isMuted) return
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const notes = [
      { freq: 659.25, time: now },       // E5
      { freq: 880.0, time: now + 0.1 },  // A5
      { freq: 1318.51, time: now + 0.2 },// E6
    ]

    notes.forEach(({ freq, time }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, time)

      gain.gain.setValueAtTime(0, time)
      gain.gain.linearRampToValueAtTime(0.18, time + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(time)
      osc.stop(time + 0.36)
    })
  }

  /**
   * Campana Zen ceremonial al finalizar el bloque Pomodoro (00:00)
   */
  public playPomodoroComplete(): void {
    if (this.isMuted) return
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(523.25, now) // C5
    osc.frequency.exponentialRampToValueAtTime(261.63, now + 1.2) // C4

    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 1.5)
  }

  /**
   * Pop/Tick háptico sutil al interactuar con el cronómetro
   */
  public playTick(): void {
    if (this.isMuted) return
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, now)
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04)

    gain.gain.setValueAtTime(0.1, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.05)
  }
}

export const soundEngine = new SoundEngine()
