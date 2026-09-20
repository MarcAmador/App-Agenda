import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState<boolean>(false)

  useEffect(() => {
    // Detectar si la app ya corre instalada en modo standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')

    setIsInstalled(isStandalone)

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      toast.success('¡AgendaPro se ha instalado correctamente en tu dispositivo!', {
        icon: '📱',
        duration: 4000,
      })
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const choiceResult = await deferredPrompt.userChoice
        if (choiceResult.outcome === 'accepted') {
          setDeferredPrompt(null)
        }
        return
      } catch (err) {
        console.error('[PWA] Error durante prompt de instalación:', err)
      }
    }

    // Guía contextual si el prompt nativo aún no está listo o en iOS Safari
    const ua = navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(ua)
    const isAndroid = /android/.test(ua)

    if (isIOS) {
      toast('En iPhone: Toca el botón Compartir (icono de caja con flecha arriba) y selecciona "Agregar a pantalla de inicio".', {
        icon: '📲',
        duration: 6000,
      })
    } else if (isAndroid) {
      toast('En Android: Toca los 3 puntos (⋮) del navegador y selecciona "Instalar aplicación" o "Agregar a pantalla principal".', {
        icon: '📱',
        duration: 5000,
      })
    } else {
      toast('En tu navegador: Haz clic en el icono de instalación en la barra de direcciones o en el menú de opciones.', {
        icon: '💻',
        duration: 4500,
      })
    }
  }

  return {
    canInstall: !isInstalled,
    isInstalled,
    promptInstall,
  }
}
