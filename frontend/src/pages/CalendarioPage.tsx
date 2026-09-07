import { AppLayout } from '@/components/layout/AppLayout'
import { TasksView } from '@/components/tasks/TasksView'

/**
 * Página de Calendario — Fase 4.
 * Muestra la vista de calendario mensual y semanal con soporte de filtros.
 */
export default function CalendarioPage() {
  return (
    <AppLayout pageTitle="Calendario">
      <TasksView
        initialViewMode="calendario"
        pageTitle="Calendario Académico"
        pageSubtitle="Planifica y visualiza tus actividades y plazos por mes y semana"
      />
    </AppLayout>
  )
}
