import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Play, Pause, Check, Maximize2, X, Target, Flame, Tv } from 'lucide-react'
import { useFocusTimer } from '@/context/FocusTimerContext'
import { usePictureInPicture } from '@/hooks/usePictureInPicture'

export function FloatingFocusTimer() {
  const {
    activeTask,
    secondsLeft,
    totalSeconds,
    isTimerRunning,
    isWidgetVisible,
    pauseTimer,
    resumeTimer,
    completeCurrentTask,
    dismissWidget,
    openFocusModal,
  } = useFocusTimer()

  const [isHovered, setIsHovered] = useState(false)
  const [pipContainer, setPipContainer] = useState<HTMLElement | null>(null)

  const { openPip, closePip, isSupported: isPipSupported, isPipActive } = usePictureInPicture({
    width: 340,
    height: 210,
    onClose: () => setPipContainer(null),
  })

  const handleTogglePip = async () => {
    if (isPipActive) {
      closePip()
      setPipContainer(null)
      return
    }
    await openPip((container) => {
      setPipContainer(container)
      return () => setPipContainer(null)
    })
  }

  if (!activeTask || !isWidgetVisible) {
    return null
  }

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const progressRatio = totalSeconds > 0 ? secondsLeft / totalSeconds : 0
  const progressPercent = Math.round(progressRatio * 100)

  // ─── Lógica de colores dinámicos reactivos ──────────────────────────────────
  // > 50%: Verde Esmeralda / Cian vibrante
  // 20% - 50%: Ámbar / Naranja cálido
  // < 20%: Rojo / Rosa enérgico con efecto de alerta pulsante
  let themeColors = {
    ringColor: '#10b981', // emerald-500
    trackColor: 'rgba(16, 185, 129, 0.15)',
    textColor: 'text-emerald-500 dark:text-emerald-400',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    glowClass: 'shadow-emerald-500/20',
    isCritical: false,
  }

  if (progressRatio <= 0.2) {
    themeColors = {
      ringColor: '#f43f5e', // rose-500
      trackColor: 'rgba(244, 63, 94, 0.2)',
      textColor: 'text-rose-500 dark:text-rose-400',
      badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
      glowClass: 'shadow-rose-500/40 shadow-lg',
      isCritical: true,
    }
  } else if (progressRatio <= 0.5) {
    themeColors = {
      ringColor: '#f59e0b', // amber-500
      trackColor: 'rgba(245, 158, 11, 0.15)',
      textColor: 'text-amber-500 dark:text-amber-400',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      glowClass: 'shadow-amber-500/25',
      isCritical: false,
    }
  }

  // Dimensiones del anillo SVG
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progressRatio * circumference)

  return (
    <>
      <aside
      role="complementary"
      aria-label="Temporizador de enfoque flotante"
      id="tour-floating-focus-timer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 transform ${
        isHovered ? 'scale-102' : 'scale-100'
      }`}
    >
      <div
        className={`relative flex items-center gap-3.5 px-4 py-3 rounded-3xl bg-base-100/95 backdrop-blur-xl border border-base-300/80 shadow-2xl ${themeColors.glowClass} max-w-sm sm:max-w-md`}
      >
        {/* Anillo de cuenta regresiva SVG */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-16 h-16 transform -rotate-90">
            {/* Pista de fondo */}
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
              className="text-base-300/60"
              fill="transparent"
            />
            {/* Anillo de progreso reactivo */}
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke={themeColors.ringColor}
              strokeWidth="4.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Tiempo restante en el centro del anillo */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`text-xs font-black tracking-tight font-mono ${themeColors.textColor} ${
                themeColors.isCritical && isTimerRunning ? 'animate-pulse' : ''
              }`}
            >
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Información de la tarea activa */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${themeColors.badgeClass}`}
            >
              <Target className="w-2.5 h-2.5" />
              <span>Modo Enfoque</span>
              {themeColors.isCritical && <Flame className="w-2.5 h-2.5 text-rose-500 animate-bounce" />}
            </span>
            <span className="text-[10px] text-base-content/50 font-medium">
              {progressPercent}%
            </span>
          </div>

          <h4
            className="text-xs font-bold text-base-content truncate max-w-[160px] sm:max-w-[190px]"
            title={activeTask.title}
          >
            {activeTask.title}
          </h4>

          <p className="text-[10px] text-base-content/60 truncate">
            {activeTask.category || 'Actividad prioritaria'}
          </p>
        </div>

        {/* Acciones de control */}
        <div className="flex items-center gap-1 shrink-0 border-l border-base-200 pl-2">
          {/* Play / Pausa */}
          <button
            type="button"
            onClick={isTimerRunning ? pauseTimer : resumeTimer}
            className="btn btn-ghost btn-circle btn-xs text-base-content/80 hover:text-primary hover:bg-primary/10 transition-colors"
            title={isTimerRunning ? 'Pausar cronómetro' : 'Reanudar cronómetro'}
          >
            {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>

          {/* Marcar Tarea como Completada */}
          <button
            type="button"
            onClick={completeCurrentTask}
            className="btn btn-ghost btn-circle btn-xs text-success hover:bg-success/15 transition-colors"
            title="Marcar tarea como completada"
          >
            <Check className="w-4 h-4" />
          </button>

          {/* Flotar sobre Windows (Picture-in-Picture) */}
          {isPipSupported && (
            <button
              type="button"
              onClick={handleTogglePip}
              className={`btn btn-ghost btn-circle btn-xs transition-colors ${
                isPipActive
                  ? 'bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/40'
                  : 'text-sky-500 hover:bg-sky-500/15'
              }`}
              title={
                isPipActive
                  ? 'Cerrar ventana flotante PiP'
                  : 'Flotar sobre otras ventanas de Windows (Picture-in-Picture)'
              }
            >
              <Tv className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Maximizar / Abrir Modal de Enfoque */}
          <button
            type="button"
            onClick={openFocusModal}
            className="btn btn-ghost btn-circle btn-xs text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors"
            title="Abrir vista completa de enfoque"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Quitar / Cerrar widget flotante */}
          <button
            type="button"
            onClick={dismissWidget}
            className="btn btn-ghost btn-circle btn-xs text-base-content/40 hover:text-error hover:bg-error/10 transition-colors"
            title="Quitar cronómetro flotante"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>

    {/* ── Renderizado reactivo dentro de la mini-ventana PiP ── */}
    {pipContainer &&
      createPortal(
        <div className="flex flex-col items-center justify-center p-3 text-center w-full h-full select-none bg-slate-900 text-white">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-1">
            <Target className="w-3 h-3" />
            <span>Modo Enfoque PiP</span>
          </div>

          <div
            className="text-xs font-bold truncate max-w-[260px] text-slate-100 mb-2 font-sans"
            title={activeTask.title}
          >
            {activeTask.title}
          </div>

          <div
            className={`text-4xl font-black font-mono tracking-tight mb-3 ${themeColors.textColor}`}
          >
            {formattedTime}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={isTimerRunning ? pauseTimer : resumeTimer}
              className="btn btn-primary btn-xs rounded-lg gap-1 font-semibold text-xs text-white"
            >
              {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
              <span>{isTimerRunning ? 'Pausar' : 'Reanudar'}</span>
            </button>

            <button
              type="button"
              onClick={completeCurrentTask}
              className="btn btn-success btn-xs rounded-lg gap-1 font-semibold text-xs text-white"
            >
              <Check className="w-3 h-3" />
              <span>Completar</span>
            </button>

            <button
              type="button"
              onClick={handleTogglePip}
              className="btn btn-ghost btn-xs rounded-lg text-slate-400 hover:text-white text-xs"
              title="Volver a la pestaña principal"
            >
              Volver
            </button>
          </div>
        </div>,
        pipContainer
      )}
  </>
  )
}
