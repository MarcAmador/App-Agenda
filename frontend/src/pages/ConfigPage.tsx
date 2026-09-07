import { Sparkles, Play } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { UserProfileCard } from '@/components/config/UserProfileCard'
import { NotificationSettings } from '@/components/config/NotificationSettings'
import { ThemeSettings } from '@/components/config/ThemeSettings'
import { ReminderLogsTable } from '@/components/config/ReminderLogsTable'
import { useOnboardingTour } from '@/hooks/useOnboardingTour'

/**
 * Página de Configuración — Fase 6.
 * Gestión integral de perfil, canales de recordatorio multicanal (Email, WhatsApp, Telegram),
 * selector de tema, tour guiado y auditoría de despacho.
 */
export default function ConfigPage() {
  const { startTour } = useOnboardingTour()

  return (
    <AppLayout pageTitle="Configuración">
      <div className="flex flex-col gap-6 animate-fade-in max-w-5xl mx-auto pb-8">
        {/* ── Encabezado de la Página ───────────────────────────────── */}
        <div>
          <h2 className="text-xl font-bold text-base-content tracking-tight">
            Configuración del Sistema
          </h2>
          <p className="text-sm text-base-content/60 mt-0.5">
            Administra tus preferencias de notificación multicanal, apariencia y cuenta institucional.
          </p>
        </div>

        {/* 1. Tarjeta de Perfil */}
        <UserProfileCard />

        {/* 2. Ajustes de Notificaciones y Canales */}
        <NotificationSettings />

        {/* 3. Ajustes de Apariencia / Tema */}
        <ThemeSettings />

        {/* 4. Tour Guiado de Bienvenida */}
        <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-base-content">Tour Guiado de Bienvenida</h3>
              <p className="text-xs text-base-content/60">
                ¿Deseas volver a ver la explicación interactiva de cada módulo del sistema?
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={startTour}
            className="btn btn-outline btn-primary btn-sm rounded-xl gap-2 font-semibold"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Iniciar Tour Ahora
          </button>
        </div>

        {/* 5. Historial de Auditoría de Envíos */}
        <ReminderLogsTable />
      </div>
    </AppLayout>
  )
}

