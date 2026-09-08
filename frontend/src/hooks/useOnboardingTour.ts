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
              'Tu plataforma ejecutiva de gestión y productividad docente. Aquí tienes el pulso diario y el resumen visual de todas tus actividades académicas.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-kpi-metrics',
          popover: {
            title: '📊 Métricas & Estado en Vivo',
            description:
              'Visualiza al instante tus tareas activas, actividades para hoy o vencidas, tareas críticas Q1 y el porcentaje de cumplimiento general.',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#tour-priority-summary',
          popover: {
            title: '⚡ Matriz Eisenhower & Próximos Plazos',
            description:
              'Monitorea la distribución estratégica de tus 4 cuadrantes (Hacer Ya, Planificar, Delegar, Eliminar) y las próximas 5 entregas con opción de completado rápido.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#tour-quick-modules',
          popover: {
            title: '🧭 Módulos Dedicados del Sistema',
            description:
              'El Dashboard es puramente informativo. Para trabajar a profundidad, haz clic en estas tarjetas o en el menú lateral para ir a las páginas completas de Tabla, Calendario, Matriz y Configuración.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#tour-btn-new-task',
          popover: {
            title: '✨ Creación Rápida de Actividades',
            description:
              'Registra una nueva actividad académica con título, fecha límite, hora, cuadrante de prioridad y etiquetas personalizadas sin salir del panel.',
            side: 'bottom',
            align: 'end',
          },
        },
        {
          element: '#tour-sidebar-nav',
          popover: {
            title: '📌 Menú Lateral Permanente',
            description:
              'Accede directamente en cualquier momento a las secciones principales de la aplicación.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-topbar-tour',
          popover: {
            title: '💡 Tour & Asistencia',
            description:
              '¡Todo listo para impulsar tu productividad docente! Puedes reiniciar este tour interactivo en cualquier momento desde este botón.',
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
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [startTour])

  return { startTour }
}
