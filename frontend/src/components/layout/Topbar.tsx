import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, User, LogOut, Settings, Sparkles, Keyboard, Volume2, VolumeX, Download } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { useOnboardingTour } from '@/hooks/useOnboardingTour'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { soundEngine } from '@/utils/audioEffects'
import toast from 'react-hot-toast'

interface TopbarProps {
  onMenuOpen: () => void
  title: string
  onOpenShortcuts?: () => void
}

export function Topbar({ onMenuOpen, title, onOpenShortcuts }: TopbarProps) {
  const { user, signOut } = useAuth()
  const { startTour } = useOnboardingTour()
  const { canInstall, promptInstall } = usePWAInstall()
  const [isMuted, setIsMuted] = useState(() => soundEngine.getMuted())

  useEffect(() => {
    const handleSoundChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isMuted: boolean }>
      setIsMuted(customEvent.detail.isMuted)
    }
    window.addEventListener('agendapro_sound_toggle', handleSoundChange)
    return () => window.removeEventListener('agendapro_sound_toggle', handleSoundChange)
  }, [])

  const handleToggleSound = () => {
    const muted = soundEngine.toggleMute()
    setIsMuted(muted)
    toast(muted ? '🔇 Sonidos desactivados' : '🔊 Sonidos activados', {
      id: 'sound-toggle',
      duration: 1800,
    })
  }

  return (
    <header className="sticky top-0 z-20 bg-base-100/80 backdrop-blur-md border-b border-base-200 px-4 lg:px-6 h-14 flex items-center justify-between gap-4">

      {/* Izquierda: Botón hamburguesa (móvil) + Título de página */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuOpen}
          className="btn btn-ghost btn-sm btn-circle lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-base-content truncate">{title}</h1>
      </div>

      {/* Derecha: Atajos + Audio + Botón Tour + Selector de tema + Avatar */}
      <div className="flex items-center gap-2">
        {/* Atajos de teclado */}
        {onOpenShortcuts && (
          <button
            type="button"
            onClick={onOpenShortcuts}
            className="btn btn-ghost btn-sm btn-circle text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors hidden sm:inline-flex"
            title="Atajos de teclado (?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        )}

        {/* Silenciar / Activar Sonidos */}
        <button
          type="button"
          onClick={handleToggleSound}
          className="btn btn-ghost btn-sm btn-circle text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors"
          title={isMuted ? 'Activar efectos de sonido' : 'Silenciar efectos de sonido'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-base-content/40" />
          ) : (
            <Volume2 className="w-4 h-4 text-primary" />
          )}
        </button>

        {/* Botón Instalar App (PWA) */}
        {canInstall && (
          <button
            type="button"
            onClick={promptInstall}
            className="btn btn-primary btn-sm rounded-xl gap-1.5 text-xs font-semibold shadow-xs hover:shadow-sm"
            title="Instalar AgendaPro en tu dispositivo"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Instalar App</span>
          </button>
        )}

        {/* Botón Tour Guiado */}
        <button
          type="button"
          id="tour-topbar-tour"
          onClick={startTour}
          className="btn btn-ghost btn-sm rounded-xl gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
          title="Iniciar Tour Guiado"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Tour Guiado</span>
        </button>

        <ThemeToggle />

        {/* Menú de usuario */}
        <div className="dropdown dropdown-end">
          <button
            tabIndex={0}
            className="btn btn-ghost btn-circle btn-sm"
            aria-label="Perfil de usuario"
          >
            {user?.user_metadata?.avatar_url ? (
              <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-base-200">
                <img
                  src={user.user_metadata.avatar_url as string}
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-base-200">
                <User className="w-4 h-4 text-primary" />
              </div>
            )}
          </button>
          <ul
            tabIndex={0}
            className="dropdown-content menu bg-base-100 rounded-2xl shadow-lg border border-base-200 w-56 p-2 mt-2 animate-scale-in"
          >
            <li className="px-2 py-1.5 pointer-events-none">
              <div className="flex flex-col gap-0">
                <span className="font-semibold text-sm text-base-content truncate">
                  {(user?.user_metadata?.full_name as string) ?? 'Usuario'}
                </span>
                <span className="text-xs text-base-content/50 truncate">{user?.email}</span>
              </div>
            </li>
            <div className="divider my-1 h-px" />
            <li>
              <Link to="/config" className="gap-2 text-sm rounded-xl flex items-center">
                <Settings className="w-4 h-4" />
                Configuración
              </Link>
            </li>
            <li>
              <button onClick={signOut} className="gap-2 text-sm text-error rounded-xl">
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  )
}

