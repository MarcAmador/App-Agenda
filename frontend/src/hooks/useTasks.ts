import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTasks, createTask, updateTask, deleteTask, updateTaskStatus, updateTaskPriority } from '@/services/tasks.service'
import type { TaskFilters } from '@/services/tasks.service'
import type { CreateTaskInput, UpdateTaskInput, Task, TaskPriority } from '@/types/database.types'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

// Cache key factory — garantiza invalidaciones precisas
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: TaskFilters) => [...taskKeys.lists(), filters] as const,
}

/** Hook para sincronización en tiempo real con Supabase Postgres Changes */
export function useTasksRealtime() {
  const qc = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('realtime:tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          qc.invalidateQueries({ queryKey: taskKeys.all })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])
}

/** Hook para listar tareas con filtros reactivos */
export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => getTasks(filters),
    staleTime: 1000 * 60 * 2, // 2 minutos de frescura en caché
    gcTime: 1000 * 60 * 10,
    placeholderData: (previousData) => previousData,
  })
}

/** Hook para crear una tarea con optimistic UI y notificaciones */
export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: () => {
      toast.success('Tarea creada correctamente')
    },
    onError: () => toast.error('Error al crear la tarea'),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

/** Hook para actualizar una tarea con optimistic UI */
export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
      updateTask(id, input),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: taskKeys.all })
      qc.setQueriesData(
        { queryKey: taskKeys.lists() },
        (old: { data: Task[]; count: number } | undefined) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((t) => (t.id === id ? { ...t, ...input } : t)),
          }
        }
      )
    },
    onSuccess: (_data, { input }) => {
      // Solo mostrar toast genérico si no es una actualización rápida de subtareas
      if (!input.checklist) {
        toast.success('Tarea actualizada')
      }
    },
    onError: () => {
      toast.error('Error al actualizar la tarea')
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

/** Hook específico para cambio rápido de estado desde el DataTable / Kanban / Dashboard */
export function useUpdateTaskStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task['status'] }) =>
      updateTaskStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: taskKeys.all })
      qc.setQueriesData(
        { queryKey: taskKeys.lists() },
        (old: { data: Task[]; count: number } | undefined) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((t) => (t.id === id ? { ...t, status } : t)),
          }
        }
      )
    },
    onSuccess: () => {
      toast.success('Estado actualizado')
    },
    onError: () => {
      toast.error('Error al cambiar el estado')
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

/** Hook para cambio rápido de prioridad / cuadrante en Matriz de Eisenhower */
export function useUpdateTaskPriority() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: TaskPriority }) =>
      updateTaskPriority(id, priority),
    onMutate: async ({ id, priority }) => {
      await qc.cancelQueries({ queryKey: taskKeys.all })
      qc.setQueriesData(
        { queryKey: taskKeys.lists() },
        (old: { data: Task[]; count: number } | undefined) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((t) => (t.id === id ? { ...t, priority } : t)),
          }
        }
      )
    },
    onError: () => {
      toast.error('Error al cambiar la prioridad')
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

/** Hook para eliminar (soft-delete) una tarea */
export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      toast.success('Tarea eliminada')
    },
    onError: () => toast.error('Error al eliminar la tarea'),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}
