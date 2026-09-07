import { AppLayout } from '@/components/layout/AppLayout'
import { TasksView } from '@/components/tasks/TasksView'

/**
 * Página de Matriz de Prioridades de Eisenhower — Fase 4.
 * Clasificación interactiva en 4 cuadrantes con Drag & Drop.
 */
export default function MatrizPage() {
  return (
    <AppLayout pageTitle="Matriz de Eisenhower">
      <TasksView
        initialViewMode="matriz"
        pageTitle="Matriz de Eisenhower"
        pageSubtitle="Organiza tus actividades según urgencia e importancia estratégica"
      />
    </AppLayout>
  )
}
