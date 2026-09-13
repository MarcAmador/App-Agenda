import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { Task, TaskStatus } from '@/types/database.types'
import { useUpdateTaskStatus } from '@/hooks/useTasks'
import { soundEngine } from '@/utils/audioEffects'
import { triggerConfetti } from '@/utils/confetti'
import toast from 'react-hot-toast'

interface FocusTimerContextType {
  activeTask: Task | null
  secondsLeft: number
  totalSeconds: number
  isTimerRunning: boolean
  isWidgetVisible: boolean
  isFocusModalOpen: boolean
  startFocus: (task: Task, durationMinutes?: number) => void
  pauseTimer: () => void
  resumeTimer: () => void
  resetTimer: () => void
  completeCurrentTask: () => void
  dismissWidget: () => void
  showWidget: () => void
  openFocusModal: () => void
  closeFocusModal: () => void
  setActiveTask: (task: Task | null) => void
}

const FocusTimerContext = createContext<FocusTimerContextType | undefined>(undefined)

const DEFAULT_POMODORO_SECONDS = 25 * 60

export function FocusTimerProvider({ children }: { children: ReactNode }) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [totalSeconds, setTotalSeconds] = useState(DEFAULT_POMODORO_SECONDS)
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_POMODORO_SECONDS)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [isWidgetVisible, setIsWidgetVisible] = useState(false)
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false)

  const updateStatus = useUpdateTaskStatus()

  // Intervalo del cronómetro
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isTimerRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false)
            soundEngine.playPomodoroComplete()
            triggerConfetti()
            toast.success('🎉 ¡Bloque de enfoque completado! Tómate un merecido descanso.', {
              duration: 5000,
              icon: '⏰',
            })
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning, secondsLeft])

  const startFocus = useCallback((task: Task, durationMinutes: number = 25) => {
    setActiveTask(task)
    const durationInSec = durationMinutes * 60
    setTotalSeconds(durationInSec)
    setSecondsLeft(durationInSec)
    setIsTimerRunning(true)
    setIsWidgetVisible(true)
    toast.success(`🎯 Modo Enfoque iniciado: "${task.title.substring(0, 30)}${task.title.length > 30 ? '...' : ''}"`, {
      duration: 3000,
      icon: '⏳',
    })
  }, [])

  const pauseTimer = useCallback(() => {
    soundEngine.playTick()
    setIsTimerRunning(false)
  }, [])

  const resumeTimer = useCallback(() => {
    if (secondsLeft > 0) {
      soundEngine.playTick()
      setIsTimerRunning(true)
    }
  }, [secondsLeft])

  const resetTimer = useCallback(() => {
    setIsTimerRunning(false)
    setSecondsLeft(totalSeconds)
  }, [totalSeconds])

  const completeCurrentTask = useCallback(() => {
    if (!activeTask) return

    updateStatus.mutate(
      { id: activeTask.id, status: 'completada' as TaskStatus },
      {
        onSuccess: () => {
          soundEngine.playSuccessChime()
          triggerConfetti()
          toast.success('🏆 ¡Excelente trabajo! Tarea de enfoque completada.', {
            duration: 4000,
            icon: '👏',
          })
          setIsTimerRunning(false)
          setIsWidgetVisible(false)
          setActiveTask(null)
          setSecondsLeft(totalSeconds)
        },
      }
    )
  }, [activeTask, totalSeconds, updateStatus])

  const dismissWidget = useCallback(() => {
    setIsWidgetVisible(false)
  }, [])

  const showWidget = useCallback(() => {
    if (activeTask) {
      setIsWidgetVisible(true)
    }
  }, [activeTask])

  const openFocusModal = useCallback(() => {
    setIsFocusModalOpen(true)
  }, [])

  const closeFocusModal = useCallback(() => {
    setIsFocusModalOpen(false)
  }, [])

  return (
    <FocusTimerContext.Provider
      value={{
        activeTask,
        secondsLeft,
        totalSeconds,
        isTimerRunning,
        isWidgetVisible,
        isFocusModalOpen,
        startFocus,
        pauseTimer,
        resumeTimer,
        resetTimer,
        completeCurrentTask,
        dismissWidget,
        showWidget,
        openFocusModal,
        closeFocusModal,
        setActiveTask,
      }}
    >
      {children}
    </FocusTimerContext.Provider>
  )
}

export function useFocusTimer() {
  const ctx = useContext(FocusTimerContext)
  if (!ctx) {
    throw new Error('useFocusTimer debe usarse dentro de FocusTimerProvider')
  }
  return ctx
}
