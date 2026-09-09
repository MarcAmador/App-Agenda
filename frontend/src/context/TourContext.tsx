import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { driver, Driver } from 'driver.js'
import 'driver.js/dist/driver.css'

export interface TourStepDefinition {
  route: string
  element: string
  title: string
  description: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
}

export const TOUR_STEPS: TourStepDefinition[] = [
  {
    route: '/',
    element: '#tour-welcome',
    title: '👋 Centro de Mando Ejecutivo',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        ¡Te damos la bienvenida a <strong>AgendaPro</strong>! Tu plataforma de alta efectividad creada para <strong>coordinadores y docentes</strong>.<br><br>
        Desde este panel central supervisas el ritmo académico de tu institución, vencimientos inminentes y el estado de todas tus actividades.
      </div>
    `,
    side: 'bottom',
    align: 'start',
  },
  {
    route: '/',
    element: '#tour-kpi-metrics',
    title: '📊 Métricas Clave en Tiempo Real',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        Monitorea al instante tus <strong>Tareas Activas</strong>, entregas programadas <strong>Para Hoy / Vencidas</strong>, actividades críticas del <strong>Cuadrante 1</strong> y tu <strong>Tasa de Efectividad</strong> porcentual.
      </div>
    `,
    side: 'bottom',
    align: 'center',
  },
  {
    route: '/',
    element: '#tour-priority-summary',
    title: '⚡ Resumen de Prioridades & Próximas Entregas',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        Visualiza el balance de tu carga en los <strong>4 cuadrantes de Eisenhower</strong> y consulta las <strong>próximas 5 entregas</strong> con opción de marcar como completada en un solo clic.
      </div>
    `,
    side: 'top',
    align: 'center',
  },
  {
    route: '/tareas',
    element: '#tour-tasks-table',
    title: '📋 Gestión de Tareas (Tabla Avanzada)',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        Hemos navegado al módulo de <strong>Tareas</strong>. Aquí cuentas con una tabla PrimeReact con <strong>búsqueda inteligente, ordenamiento por columnas, filtros combinables y paginación configurable</strong>.
      </div>
    `,
    side: 'top',
    align: 'center',
  },
  {
    route: '/matriz',
    element: '#tour-matrix-view',
    title: '🎯 Matriz de Prioridades de Eisenhower',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        Bienvenido a la <strong>Matriz de Eisenhower</strong>. Clasifica tus actividades según urgencia e impacto estratégico:<br><br>
        • <strong style="color: #ef4444;">Q1 Hacer Ya</strong>: Entregas y evaluaciones inminentes.<br>
        • <strong style="color: #10b981;">Q2 Planificar</strong>: Preparación de clases y proyectos.<br>
        • <strong style="color: #f59e0b;">Q3 Delegar</strong>: Rutinas y firmas administrativas.<br>
        • <strong style="color: #64748b;">Q4 Baja Prioridad</strong>: Tareas aplazables.<br><br>
        ✨ <em>¡Arrastra y suelta tarjetas entre cuadrantes con total libertad interactiva!</em>
      </div>
    `,
    side: 'top',
    align: 'center',
  },
  {
    route: '/calendario',
    element: '#tour-calendar-view',
    title: '📅 Calendario Académico Integral',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        Planifica cronogramas bimestrales y mensuales. Explora vistas dinámicas de <strong>Mes y Semana</strong>, y haz clic en cualquier día para agendar actividades rápidamente.
      </div>
    `,
    side: 'top',
    align: 'center',
  },
  {
    route: '/config',
    element: '#tour-notifications-section',
    title: '🔔 Alertas Multicanal & Anticipación',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        Personaliza la entrega de tus recordatorios por <strong>Gmail SMTP real</strong>, <strong>WhatsApp</strong> y <strong>Telegram</strong>.<br><br>
        Con el nuevo <strong>MultiSelect</strong> puedes elegir múltiples tiempos a la vez (3m, 5m, 10m, 15m, 1h) para que el sistema te alerte oportunamente.
      </div>
    `,
    side: 'top',
    align: 'center',
  },
  {
    route: '/config',
    element: '#tour-audit-section',
    title: '📜 Auditoría de Notificaciones en Vivo',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        Transparencia absoluta: audita en vivo cada aviso despachado por el sistema con su canal, hora programada, fecha de entrega y estado confirmado.
      </div>
    `,
    side: 'top',
    align: 'center',
  },
  {
    route: '/',
    element: '#tour-topbar-tour',
    title: '🚀 ¡Todo Listo para Triunfar!',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        ¡Has completado el tour por todos los módulos de <strong>AgendaPro</strong>!<br><br>
        Puedes volver a iniciar este recorrido interactivo en cualquier momento haciendo clic en este botón de la barra superior.
      </div>
    `,
    side: 'bottom',
    align: 'end',
  },
]

interface TourContextValue {
  startTour: () => void
  stopTour: () => void
}

const TourContext = createContext<TourContextValue | null>(null)

function cleanupDriverDOM() {
  document.querySelectorAll('.driver-overlay, .driver-popover').forEach((el) => {
    el.remove()
  })
}

function waitForElement(selector: string, timeout = 3500): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const el = document.querySelector<HTMLElement>(selector)
    if (el) return resolve(el)

    const startTime = Date.now()
    const interval = setInterval(() => {
      const found = document.querySelector<HTMLElement>(selector)
      if (found) {
        clearInterval(interval)
        resolve(found)
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval)
        resolve(null)
      }
    }, 50)
  })
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const driverInstanceRef = useRef<Driver | null>(null)
  const isNavigatingRef = useRef(false)

  const cleanupDriver = useCallback(() => {
    if (driverInstanceRef.current) {
      try {
        driverInstanceRef.current.destroy()
      } catch {
        // Driver might already be destroyed
      }
      driverInstanceRef.current = null
    }
    cleanupDriverDOM()
  }, [])

  const stopTour = useCallback(() => {
    sessionStorage.removeItem('agendapro_tour_active')
    sessionStorage.removeItem('agendapro_tour_step')
    localStorage.setItem('agendapro_tour_completed', 'true')
    isNavigatingRef.current = false
    cleanupDriver()
  }, [cleanupDriver])

  const executeStep = useCallback(
    async (stepIndex: number) => {
      if (stepIndex < 0 || stepIndex >= TOUR_STEPS.length) {
        stopTour()
        return
      }

      const step = TOUR_STEPS[stepIndex]

      // Guardar el paso actual en sessionStorage
      sessionStorage.setItem('agendapro_tour_active', 'true')
      sessionStorage.setItem('agendapro_tour_step', String(stepIndex))

      // Si el paso requiere otra ruta, navegar primero limpiando la instancia previa
      if (location.pathname !== step.route) {
        isNavigatingRef.current = true
        cleanupDriver()
        navigate(step.route)
        return
      }

      // Esperar a que el elemento objetivo esté montado en el DOM
      const targetEl = await waitForElement(step.element, 3500)
      if (!targetEl) {
        console.warn(`[Tour] Elemento ${step.element} no encontrado en ${step.route}. Saltando al siguiente...`)
        if (stepIndex + 1 < TOUR_STEPS.length) {
          executeStep(stepIndex + 1)
        } else {
          stopTour()
        }
        return
      }

      // Limpiar rigurosamente cualquier overlay o popover previo antes de dibujar el nuevo paso
      cleanupDriver()
      isNavigatingRef.current = false

      // Desplazar suavemente hacia el elemento objetivo
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

      const isFirst = stepIndex === 0
      const isLast = stepIndex === TOUR_STEPS.length - 1

      const driverObj = driver({
        animate: true,
        allowClose: true,
        showProgress: true,
        progressText: `Paso ${stepIndex + 1} de ${TOUR_STEPS.length}`,
        nextBtnText: isLast ? '¡Comenzar ahora! 🚀' : 'Siguiente →',
        prevBtnText: isFirst ? '' : '← Anterior',
        showButtons: isFirst ? ['next', 'close'] : ['next', 'previous', 'close'],
        steps: [
          {
            element: step.element,
            popover: {
              title: step.title,
              description: step.description,
              side: step.side ?? 'bottom',
              align: step.align ?? 'center',
            },
          },
        ],
        onNextClick: () => {
          if (isLast) {
            stopTour()
          } else {
            isNavigatingRef.current = true
            cleanupDriver()
            executeStep(stepIndex + 1)
          }
        },
        onPrevClick: () => {
          if (!isFirst) {
            isNavigatingRef.current = true
            cleanupDriver()
            executeStep(stepIndex - 1)
          }
        },
        onCloseClick: () => {
          stopTour()
        },
        onDestroyStarted: () => {
          if (!isNavigatingRef.current) {
            stopTour()
          }
        },
      })

      driverInstanceRef.current = driverObj
      driverObj.drive()
    },
    [location.pathname, navigate, stopTour, cleanupDriver]
  )

  const startTour = useCallback(() => {
    sessionStorage.setItem('agendapro_tour_active', 'true')
    sessionStorage.setItem('agendapro_tour_step', '0')
    isNavigatingRef.current = true
    cleanupDriver()

    if (location.pathname !== '/') {
      navigate('/')
    } else {
      executeStep(0)
    }
  }, [location.pathname, navigate, executeStep, cleanupDriver])

  // Listener para reanudar el tour al cambiar de página o al montar
  useEffect(() => {
    const isTourActive = sessionStorage.getItem('agendapro_tour_active') === 'true'
    const pendingStepStr = sessionStorage.getItem('agendapro_tour_step')

    if (isTourActive && pendingStepStr !== null) {
      const stepIndex = parseInt(pendingStepStr, 10)
      if (!isNaN(stepIndex) && stepIndex >= 0 && stepIndex < TOUR_STEPS.length) {
        const expectedRoute = TOUR_STEPS[stepIndex].route
        if (location.pathname === expectedRoute) {
          // Breve retardo para permitir que React termine de montar la vista y sus datos
          const timer = setTimeout(() => {
            executeStep(stepIndex)
          }, 300)
          return () => clearTimeout(timer)
        }
      }
    }
  }, [location.pathname, executeStep])

  return (
    <TourContext.Provider value={{ startTour, stopTour }}>
      {children}
    </TourContext.Provider>
  )
}

export function useTour() {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error('useTour debe usarse dentro de un TourProvider')
  }
  return context
}
