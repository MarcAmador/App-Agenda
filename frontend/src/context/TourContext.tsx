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
  // ─── DASHBOARD (Ruta: /) ──────────────────────────────────────────────────
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
    title: '📊 Indicadores Clave en Tiempo Real',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        Monitorea al instante tus <strong>Tareas Activas</strong>, entregas programadas <strong>Para Hoy / Vencidas</strong>, compromisos críticos del <strong>Cuadrante 1</strong> y tu <strong>Tasa de Efectividad</strong> en porcentaje.
      </div>
    `,
    side: 'bottom',
    align: 'center',
  },
  {
    route: '/',
    element: '#tour-btn-new-task',
    title: '➕ Registro Rápido de Tareas',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        Crea actividades docentes con un solo clic. Especifica fecha límite, horario de entrega, prioridad en la matriz, etiquetas institucionales y canales de recordatorio.
      </div>
    `,
    side: 'bottom',
    align: 'end',
  },
  {
    route: '/',
    element: '#tour-priority-summary',
    title: '⚡ Balance de los 4 Cuadrantes',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        Visualiza el balance de tu carga de trabajo en la matriz de Eisenhower. Haz clic sobre cualquier cuadrante (Q1, Q2, Q3, Q4) para saltar de inmediato a la matriz interactiva.
      </div>
    `,
    side: 'top',
    align: 'center',
  },
  {
    route: '/',
    element: '#tour-upcoming-tasks',
    title: '⏰ Próximos Vencimientos',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        Aquí tienes tus próximas 5 entregas más cercanas. Puedes marcar una tarea como <strong>completada</strong> con 1 solo clic en el botón de check verde.
      </div>
    `,
    side: 'top',
    align: 'center',
  },
  {
    route: '/',
    element: '#tour-quick-modules',
    title: '🚀 Accesos Rápidos a Módulos',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        Tarjetas de navegación rápida para saltar directamente a la Tabla de Tareas, Matriz Eisenhower, Calendario o Configuración Multicanal.
      </div>
    `,
    side: 'top',
    align: 'center',
  },
  {
    route: '/',
    element: '#tour-sidebar-nav',
    title: '🧭 Menú Lateral & Badges Dinámicos',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        Navegación principal de la plataforma. Observa los <strong>badges reactivos</strong> que muestran el número de tareas activas sin necesidad de recargar la página.
      </div>
    `,
    side: 'right',
    align: 'start',
  },

  // ─── TAREAS (Ruta: /tareas) ───────────────────────────────────────────────
  {
    route: '/tareas',
    element: '#tour-view-modes',
    title: '📋 Selector de Vistas Interactivas',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        Cambia en cualquier momento entre <strong>Vista Tabla</strong>, <strong>Vista Calendario</strong> y <strong>Matriz</strong> manteniendo sincronizadas tus tareas y filtros.
      </div>
    `,
    side: 'bottom',
    align: 'end',
  },
  {
    route: '/tareas',
    element: '#tour-stats',
    title: '🏷️ Filtros de Estado con 1 Clic',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        Tarjetas estadísticas interactivas: haz clic sobre <strong>Pendientes</strong>, <strong>En curso</strong>, <strong>Completadas</strong> o <strong>Vencidas</strong> para filtrar la lista instantáneamente.
      </div>
    `,
    side: 'bottom',
    align: 'center',
  },
  {
    route: '/tareas',
    element: '#tour-advanced-filters',
    title: '🔍 Búsqueda & Filtros Combinables',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        Búsqueda por texto en tiempo real sobre títulos y descripciones, combinable con selector de prioridad y filtros temporales rápidos (Hoy, Esta Semana, Este Mes).
      </div>
    `,
    side: 'bottom',
    align: 'center',
  },
  {
    route: '/tareas',
    element: '#tour-tasks-table',
    title: '📑 Tabla Avanzada PrimeReact',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        Tabla interactiva con <strong>ordenamiento por columnas</strong>, badges de estado clicables para cambiar de estado al instante, acciones de edición, archivo y paginación configurable.
      </div>
    `,
    side: 'top',
    align: 'center',
  },

  // ─── MATRIZ DE EISENHOWER (Ruta: /matriz) ──────────────────────────────────
  {
    route: '/matriz',
    element: '#tour-matrix-distribution',
    title: '🎯 Distribución y Balance de Tiempo',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        Barra continua porcentual que analiza el equilibrio de tu carga docente y te alerta en caso de sobrecarga de emergencias en el Cuadrante 1.
      </div>
    `,
    side: 'bottom',
    align: 'center',
  },
  {
    route: '/matriz',
    element: '#tour-matrix-quadrants',
    title: '🗂️ Los 4 Cuadrantes Estratégicos',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        • <strong style="color: #ef4444;">Q1 Hacer Ya:</strong> Urgente e Importante (fechas límite).<br>
        • <strong style="color: #10b981;">Q2 Planificar:</strong> Importante no Urgente (preparación y calidad).<br>
        • <strong style="color: #f59e0b;">Q3 Delegar:</strong> Urgente no Importante (trámites secundarios).<br>
        • <strong style="color: #64748b;">Q4 Baja Prioridad:</strong> Tareas eliminables o aplazables.
      </div>
    `,
    side: 'top',
    align: 'center',
  },
  {
    route: '/matriz',
    element: '#tour-matrix-view',
    title: '✨ Drag & Drop Interactivo',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        ¡Arrastra y suelta tarjetas entre cualquiera de los 4 cuadrantes para actualizar su prioridad y nivel de urgencia de forma inmediata!
      </div>
    `,
    side: 'top',
    align: 'center',
  },

  // ─── CALENDARIO (Ruta: /calendario) ────────────────────────────────────────
  {
    route: '/calendario',
    element: '#tour-calendar-controls',
    title: '📅 Controles de Navegación del Calendario',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        Navega entre meses y semanas con las flechas, pulsa 'Hoy' para volver a la fecha actual y alterna con un clic entre <strong>Vista Mes</strong> y <strong>Vista Semana</strong>.
      </div>
    `,
    side: 'bottom',
    align: 'center',
  },
  {
    route: '/calendario',
    element: '#tour-calendar-grid',
    title: '🗓️ Cuadrícula de Actividades en Fecha Local',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        Cada celda refleja con precisión tus actividades según tu fecha local. Haz clic sobre cualquier día para agendar una nueva tarea programada para esa fecha.
      </div>
    `,
    side: 'top',
    align: 'center',
  },

  // ─── CONFIGURACIÓN (Ruta: /config) ─────────────────────────────────────────
  {
    route: '/config',
    element: '#tour-notifications-section',
    title: '🔔 Canales de Alerta Multicanal',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        Configura los canales donde recibirás avisos: <strong>Correo Gmail real</strong>, mensajes directos por <strong>WhatsApp</strong> y alertas mediante el bot de <strong>Telegram</strong>.
      </div>
    `,
    side: 'top',
    align: 'center',
  },
  {
    route: '/config',
    element: '#tour-lead-times-multiselect',
    title: '⏱️ Tiempos de Anticipación (MultiSelect)',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        Elige varios tiempos de alerta simultáneos (ej: 3 min, 5 min, 15 min, 1 hora) para recibir recordatorios oportunos antes del vencimiento de cada entrega.
      </div>
    `,
    side: 'top',
    align: 'center',
  },
  {
    route: '/config',
    element: '#tour-audit-section',
    title: '📜 Auditoría de Envíos en Tiempo Real',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        Trazabilidad inmutable: revisa en vivo cada aviso despachado por el sistema con su canal, hora programada, fecha de entrega y confirmación de recepción.
      </div>
    `,
    side: 'top',
    align: 'center',
  },

  // ─── FINAL DEL TOUR (Ruta: /) ──────────────────────────────────────────────
  {
    route: '/',
    element: '#tour-topbar-tour',
    title: '🎉 ¡Todo Listo para Triunfar!',
    description: `
      <div style="font-size: 13.5px; line-height: 1.65; opacity: 0.9;">
        ¡Has completado el recorrido integral por los módulos de <strong>AgendaPro</strong>!<br><br>
        Puedes volver a iniciar este tour interactivo en cualquier momento haciendo clic en este botón de la barra superior.
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

/**
 * Limpia cualquier elemento residual de Driver.js en el DOM
 */
function cleanupDriverDOM() {
  document.querySelectorAll('.driver-overlay, .driver-popover').forEach((el) => {
    el.remove()
  })
}

/**
 * Espera de forma no bloqueante a que el elemento objetivo aparezca en el DOM
 */
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

/**
 * Determina dinámicamente el mejor lado del popover según la posición real del elemento en el viewport.
 * Evita desbordamientos hacia abajo o hacia los lados.
 */
function getSmartPlacement(
  el: HTMLElement,
  preferredSide?: 'top' | 'bottom' | 'left' | 'right'
): { side: 'top' | 'bottom' | 'left' | 'right'; align: 'start' | 'center' | 'end' } {
  const rect = el.getBoundingClientRect()
  const vh = window.innerHeight
  const vw = window.innerWidth
  const spaceBelow = vh - rect.bottom
  const spaceAbove = rect.top
  const spaceRight = vw - rect.right

  let side = preferredSide ?? 'bottom'

  // Si el elemento está en la parte inferior y no cabe abajo → colocar arriba
  if (preferredSide === 'bottom' && spaceBelow < 280 && spaceAbove > spaceBelow) {
    side = 'top'
  }
  // Si el elemento está muy arriba y no cabe arriba → colocar abajo
  else if (preferredSide === 'top' && spaceAbove < 240 && spaceBelow > spaceAbove) {
    side = 'bottom'
  }
  // Si es un menú lateral estrecho en la izquierda con mucho espacio a la derecha → colocar a la derecha
  else if (rect.width < 340 && rect.left < 200 && spaceRight > 380) {
    side = 'right'
  }

  return { side, align: 'center' }
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const driverInstanceRef = useRef<Driver | null>(null)
  const isTransitioningRef = useRef(false)

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
    isTransitioningRef.current = false
    cleanupDriver()
  }, [cleanupDriver])

  const executeStep = useCallback(
    async (stepIndex: number) => {
      if (stepIndex < 0 || stepIndex >= TOUR_STEPS.length) {
        stopTour()
        return
      }

      const step = TOUR_STEPS[stepIndex]

      sessionStorage.setItem('agendapro_tour_active', 'true')
      sessionStorage.setItem('agendapro_tour_step', String(stepIndex))

      // Si el paso requiere otra ruta, navegar primero y esperar
      if (location.pathname !== step.route) {
        isTransitioningRef.current = true
        cleanupDriver()
        navigate(step.route)
        return
      }

      const targetEl = await waitForElement(step.element, 3500)
      if (!targetEl) {
        console.warn(`[Tour] Elemento ${step.element} no encontrado en ${step.route}. Saltando...`)
        if (stepIndex + 1 < TOUR_STEPS.length) {
          executeStep(stepIndex + 1)
        } else {
          stopTour()
        }
        return
      }

      // Limpiar cualquier overlay previo para evitar capas duplicadas oscuras
      cleanupDriver()
      isTransitioningRef.current = false

      // Scroll con 'nearest' para evitar desplazamientos excesivos al fondo
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
      await new Promise((r) => setTimeout(r, 220))

      const placement = getSmartPlacement(targetEl, step.side)
      const isFirst = stepIndex === 0
      const isLast = stepIndex === TOUR_STEPS.length - 1

      const driverObj = driver({
        animate: true,
        allowClose: true,
        smoothScroll: false,
        stagePadding: 8,
        showProgress: true,
        progressText: `Paso {{current}} de {{total}}`,
        nextBtnText: isLast ? '🎉 ¡Comenzar ahora!' : 'Siguiente →',
        prevBtnText: '← Anterior',
        showButtons: isFirst ? ['next', 'close'] : ['next', 'previous', 'close'],
        steps: [
          {
            element: step.element,
            popover: {
              title: step.title,
              description: step.description,
              side: placement.side,
              align: step.align ?? placement.align,
            },
          },
        ],
        onNextClick: () => {
          if (isLast) {
            stopTour()
          } else {
            const nextIdx = stepIndex + 1
            const nextStep = TOUR_STEPS[nextIdx]
            isTransitioningRef.current = true
            sessionStorage.setItem('agendapro_tour_step', String(nextIdx))
            cleanupDriver()
            if (location.pathname !== nextStep.route) {
              navigate(nextStep.route)
            } else {
              executeStep(nextIdx)
            }
          }
        },
        onPrevClick: () => {
          if (!isFirst) {
            const prevIdx = stepIndex - 1
            const prevStep = TOUR_STEPS[prevIdx]
            isTransitioningRef.current = true
            sessionStorage.setItem('agendapro_tour_step', String(prevIdx))
            cleanupDriver()
            if (location.pathname !== prevStep.route) {
              navigate(prevStep.route)
            } else {
              executeStep(prevIdx)
            }
          }
        },
        onCloseClick: () => {
          stopTour()
        },
        onDestroyStarted: () => {
          // Solo detener si el usuario cerró el tour manualmente, no si estamos navegando entre pasos
          if (!isTransitioningRef.current) {
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
    isTransitioningRef.current = true
    cleanupDriver()

    if (location.pathname !== '/') {
      navigate('/')
    } else {
      executeStep(0)
    }
  }, [location.pathname, navigate, executeStep, cleanupDriver])

  // Listener para continuar el tour cuando cambia la ruta de la aplicación
  useEffect(() => {
    const isTourActive = sessionStorage.getItem('agendapro_tour_active') === 'true'
    const pendingStepStr = sessionStorage.getItem('agendapro_tour_step')

    if (isTourActive && pendingStepStr !== null) {
      const stepIndex = parseInt(pendingStepStr, 10)
      if (!isNaN(stepIndex) && stepIndex >= 0 && stepIndex < TOUR_STEPS.length) {
        const expectedRoute = TOUR_STEPS[stepIndex].route
        if (location.pathname === expectedRoute) {
          const timer = setTimeout(() => {
            executeStep(stepIndex)
          }, 350)
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
