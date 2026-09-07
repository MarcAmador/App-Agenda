import { useCallback, useEffect } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

export function useOnboardingTour() {
  const startTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      nextBtnText: 'Siguiente →',
      prevBtnText: '← Anterior',
      doneBtnText: '¡Entendido, Comenzar! 🚀',
      progressText: 'Paso {{current}} de {{total}}',
      steps: [
        {
          element: '#tour-welcome',
          popover: {
            title: '👋 ¡Bienvenido a AgendaPro!',
            description:
              'Tu plataforma de productividad académica y gestión docente. Aquí tendrás el control completo de tus actividades, fechas límites y entregas.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-stats',
          popover: {
            title: '📊 Tarjetas de Estado Rápidas',
            description:
              'Monitorea en tiempo real tus actividades pendientes, en curso, completadas o vencidas. Haz clic en cualquiera de ellas para filtrar la vista instantáneamente.',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#tour-view-modes',
          popover: {
            title: '🔄 Vistas Interactivas',
            description:
              'Alterna entre la Vista Tabla (con búsqueda y filtros avanzados), la Vista Calendario (mensual/semanal) y la Matriz de Eisenhower.',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#btn-nueva-tarea',
          popover: {
            title: '⚡ Creación Rápida de Tareas',
            description:
              'Crea actividades académicas asignando cuadrante de prioridad, fecha límite, hora de entrega y etiquetas personalizadas.',
            side: 'left',
            align: 'center',
          },
        },
        {
          element: '#tour-sidebar-nav',
          popover: {
            title: '🧭 Navegación del Sistema',
            description:
              'Accede directamente al Dashboard, Tareas, Calendario, Matriz y al Panel de Configuración desde este menú lateral.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-topbar-tour',
          popover: {
            title: '💡 Tour & Ayuda Permanente',
            description:
              '¡Listo! Puedes volver a iniciar este tour en cualquier momento haciendo clic en este botón de la barra superior o desde Configuración.',
            side: 'bottom',
            align: 'end',
          },
        },
      ],
      onDestroyStarted: () => {
        localStorage.setItem('agendapro_tour_completed', 'true')
        driverObj.destroy()
      },
    })

    driverObj.drive()
  }, [])

  // Iniciar automáticamente solo en la primera visita
  useEffect(() => {
    const completed = localStorage.getItem('agendapro_tour_completed')
    if (!completed) {
      const timer = setTimeout(() => {
        startTour()
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [startTour])

  return { startTour }
}
