import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'

interface UsePictureInPictureOptions {
  width?: number
  height?: number
  onClose?: () => void
}

export function usePictureInPicture(options: UsePictureInPictureOptions = {}) {
  const { width = 340, height = 220, onClose } = options
  const [isPipActive, setIsPipActive] = useState(false)
  const pipWindowRef = useRef<Window | null>(null)

  // Detectar soporte para Document Picture-in-Picture API
  const isSupported = typeof window !== 'undefined' && 'documentPictureInPicture' in window

  const closePip = useCallback(() => {
    if (pipWindowRef.current) {
      pipWindowRef.current.close()
      pipWindowRef.current = null
    }
    setIsPipActive(false)
    onClose?.()
  }, [onClose])

  const openPip = useCallback(
    async (renderContent: (container: HTMLElement) => () => void) => {
      if (!isSupported) {
        toast('Picture-in-Picture de ventanas no está soportado en este navegador. Utiliza Chrome o Edge para flotar sobre el escritorio.', {
          icon: 'ℹ️',
          duration: 4000,
        })
        return null
      }

      // Si ya hay una ventana PiP abierta, cerrarla
      if (pipWindowRef.current) {
        pipWindowRef.current.close()
      }

      try {
        const dpip = (window as any).documentPictureInPicture
        const pipWindow = await dpip.requestWindow({
          width,
          height,
        })

        pipWindowRef.current = pipWindow
        setIsPipActive(true)

        // Copiar hojas de estilo de la ventana principal al PiP para renderizado fiel de Tailwind y DaisyUI
        const allStyleSheets = Array.from(document.styleSheets)
        allStyleSheets.forEach((styleSheet) => {
          try {
            if (styleSheet.href) {
              const link = pipWindow.document.createElement('link')
              link.rel = 'stylesheet'
              link.href = styleSheet.href
              pipWindow.document.head.appendChild(link)
            } else if (styleSheet.cssRules) {
              const style = pipWindow.document.createElement('style')
              Array.from(styleSheet.cssRules).forEach((rule) => {
                style.appendChild(pipWindow.document.createTextNode(rule.cssText))
              })
              pipWindow.document.head.appendChild(style)
            }
          } catch {
            // Ignorar errores de CORS en hojas de estilo de terceros
          }
        })

        // Título y fondo de la ventana PiP
        pipWindow.document.title = '⏱️ AgendaPro — Modo Enfoque'
        pipWindow.document.body.className = 'bg-slate-900 text-white m-0 p-3 overflow-hidden select-none font-sans flex items-center justify-center min-h-screen'

        const container = pipWindow.document.createElement('div')
        container.className = 'w-full h-full flex flex-col items-center justify-center'
        pipWindow.document.body.appendChild(container)

        // Ejecutar callback de renderizado
        const cleanup = renderContent(container)

        // Escuchar cierre de la ventana PiP
        pipWindow.addEventListener('pagehide', () => {
          cleanup()
          setIsPipActive(false)
          pipWindowRef.current = null
          onClose?.()
        })

        return pipWindow
      } catch (err) {
        console.error('[PiP] Error al abrir ventana flotante:', err)
        setIsPipActive(false)
        return null
      }
    },
    [isSupported, width, height, onClose]
  )

  useEffect(() => {
    return () => {
      if (pipWindowRef.current) {
        pipWindowRef.current.close()
      }
    }
  }, [])

  return {
    isSupported,
    isPipActive,
    openPip,
    closePip,
  }
}
