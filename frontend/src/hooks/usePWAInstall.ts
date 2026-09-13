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
    if (!deferredPrompt) {
      toast('Para instalar AgendaPro, usa la opción "Instalar aplicación" o "Agregar a pantalla de inicio" desde el menú de tu navegador.', {
        icon: 'ℹ️',
        duration: 4000,
      })
      return
    }

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null)
      }
    } catch (err) {
      console.error('[PWA] Error durante prompt de instalación:', err)
    }
  }

  return {
    canInstall: !isInstalled && !!deferredPrompt,
    isInstalled,
    promptInstall,
  }
}
