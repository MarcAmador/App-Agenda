import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useFocusTimer } from '@/context/FocusTimerContext'
import { soundEngine } from '@/utils/audioEffects'
import toast from 'react-hot-toast'

interface GlobalShortcutsOptions {
  onOpenNewTask?: () => void
  onToggleShortcutsModal?: () => void
  onCloseModals?: () => void
}

export function useGlobalShortcuts({
  onOpenNewTask,
  onToggleShortcutsModal,
  onCloseModals,
}: GlobalShortcutsOptions = {}) {
  const {
    activeTask,
    isTimerRunning,
    pauseTimer,
    resumeTimer,
    openFocusModal,
    isFocusModalOpen,
    closeFocusModal,
  } = useFocusTimer()

  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Si el foco está en un elemento de texto, ignorar atajos de una sola tecla
      const target = e.target as HTMLElement | null
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)

      if (isInput) return

      // Atajo: 'Esc' para cerrar modales si están abiertos
      if (e.key === 'Escape') {
        if (isFocusModalOpen) {
          e.preventDefault()
          closeFocusModal()
          return
        }
        onCloseModals?.()
        return
      }

      // Atajo: '?' (Shift + /) para abrir la guía de atajos
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        onToggleShortcutsModal?.()
        return
      }

      // Atajo: '/' para buscar (ir a /tareas)
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        if (location.pathname !== '/tareas') {
          navigate('/tareas')
        }
        // Enfocar input de búsqueda tras navegación
        setTimeout(() => {
          const searchInput = document.querySelector<HTMLInputElement>(
            '#tour-advanced-filters input, input[type="search"]'
          )
          if (searchInput) {
            searchInput.focus()
            searchInput.select()
          }
        }, 150)
        return
      }

      // Atajo: 'N' para nueva tarea
      if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        onOpenNewTask?.()
        return
      }

      // Atajo: 'T' para abrir el Modo Enfoque
      if ((e.key === 't' || e.key === 'T') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        if (isFocusModalOpen) {
          closeFocusModal()
        } else {
          openFocusModal()
        }
        return
      }

      // Atajo: 'Espacio' para pausar / reanudar cronómetro activo
      if (e.code === 'Space' && activeTask) {
        e.preventDefault()
        if (isTimerRunning) {
          pauseTimer()
          toast('⏸️ Cronómetro de enfoque pausado', { id: 'timer-status', duration: 1800 })
        } else {
          resumeTimer()
          toast('▶️ Cronómetro de enfoque reanudado', { id: 'timer-status', duration: 1800 })
        }
        return
      }

      // Atajo: 'M' para alternar silenciado de sonido
      if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        const isMuted = soundEngine.toggleMute()
        toast(isMuted ? '🔇 Sonidos desactivados' : '🔊 Sonidos activados', {
          id: 'sound-toggle',
          duration: 2000,
        })
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    activeTask,
    isTimerRunning,
    pauseTimer,
    resumeTimer,
    openFocusModal,
    isFocusModalOpen,
    closeFocusModal,
    location.pathname,
    navigate,
    onOpenNewTask,
    onToggleShortcutsModal,
    onCloseModals,
  ])
}
