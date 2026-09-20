import { useState } from 'react'
import type { ReactNode } from 'react'
import { WifiOff } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { BottomNav } from './BottomNav'
import { FloatingFocusTimer } from '@/components/tasks/FloatingFocusTimer'
import { FocusModeModal } from '@/components/tasks/FocusModeModal'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'
import { KeyboardShortcutsModal } from '@/components/common/KeyboardShortcutsModal'
import { useFocusTimer } from '@/context/FocusTimerContext'
import { useTasks, useUpdateTaskStatus, useUpdateTask, useCreateTask } from '@/hooks/useTasks'
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import type { CreateTaskInput } from '@/types/database.types'

interface AppLayoutProps {
  children: ReactNode
  pageTitle: string
}

/**
 * Layout principal de la aplicación: Sidebar fijo (desktop) + Drawer (móvil) + Topbar + Contenido.
 */
export function AppLayout({ children, pageTitle }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false)
  const [globalTaskModalOpen, setGlobalTaskModalOpen] = useState(false)

  const { isFocusModalOpen, closeFocusModal } = useFocusTimer()
  const { data: tasksData } = useTasks()
  const createTask = useCreateTask()
  const updateStatus = useUpdateTaskStatus()
  const updateTask = useUpdateTask()

  const tasks = tasksData?.data ?? []

  // Conectar atajos de teclado globales
  useGlobalShortcuts({
    onOpenNewTask: () => setGlobalTaskModalOpen(true),
    onToggleShortcutsModal: () => setShortcutsModalOpen((prev) => !prev),
    onCloseModals: () => {
      setGlobalTaskModalOpen(false)
      setShortcutsModalOpen(false)
    },
  })

  const handleCreateTask = (input: CreateTaskInput) => {
    createTask.mutate(input, {
      onSuccess: () => setGlobalTaskModalOpen(false),
    })
  }

  const { isOnline, pendingCount } = useOfflineSync()

  return (
    <div className="flex h-screen bg-base-200 overflow-hidden relative">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Área principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          onMenuOpen={() => setSidebarOpen(true)}
          title={pageTitle}
          onOpenShortcuts={() => setShortcutsModalOpen(true)}
        />

        {/* Banner de Modo Sin Conexión */}
        {!isOnline && (
          <div className="bg-amber-500 text-amber-950 px-4 py-1.5 text-xs font-semibold flex items-center justify-between shadow-xs z-10 shrink-0">
            <div className="flex items-center gap-2 mx-auto">
              <WifiOff className="w-3.5 h-3.5 animate-pulse" />
              <span>
                Modo sin conexión activo — AgendaPro continuará guardando tus actividades localmente hasta recuperar internet.
              </span>
              {pendingCount > 0 && (
                <span className="badge badge-xs bg-amber-950 text-white font-bold ml-1">
                  {pendingCount} por sincronizar
                </span>
              )}
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 pb-24 lg:pb-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Navegación Móvil Inferior */}
      <BottomNav onOpenNewTask={() => setGlobalTaskModalOpen(true)} />

      {/* Cronómetro Flotante Superpuesto en Toda la Aplicación */}
      <FloatingFocusTimer />

      {/* Modal Global de Modo Enfoque ("¿Qué hago ahora?") */}
      <FocusModeModal
        visible={isFocusModalOpen}
        tasks={tasks}
        onHide={closeFocusModal}
        onUpdateStatus={(id, status) => updateStatus.mutate({ id, status })}
        onUpdateTask={(id, input) => updateTask.mutate({ id, input })}
      />

      {/* Modal Global de Registro Rápido de Tareas (Atajo 'N') */}
      <TaskFormModal
        visible={globalTaskModalOpen}
        task={null}
        initialValues={null}
        onHide={() => setGlobalTaskModalOpen(false)}
        onSubmit={handleCreateTask}
        isSubmitting={createTask.isPending}
      />

      {/* Modal de Guía de Atajos de Teclado (Atajo '?') */}
      <KeyboardShortcutsModal
        visible={shortcutsModalOpen}
        onHide={() => setShortcutsModalOpen(false)}
      />
    </div>
  )
}
