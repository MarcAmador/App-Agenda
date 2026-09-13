import { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { updateTask, updateTaskStatus } from '@/services/tasks.service'
import { soundEngine } from '@/utils/audioEffects'
import { triggerConfetti } from '@/utils/confetti'
import toast from 'react-hot-toast'

export interface OfflineAction {
  id: string
  type: 'update_status' | 'update_task'
  taskId: string
  payload: any
  timestamp: number
}

const STORAGE_KEY = 'agendapro_offline_queue'

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [pendingCount, setPendingCount] = useState<number>(0)
  const queryClient = useQueryClient()

  const getQueue = useCallback((): OfflineAction[] => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }, [])

  const saveQueue = useCallback((queue: OfflineAction[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
      setPendingCount(queue.length)
    }
  }, [])

  // Añadir una acción a la cola offline
  const enqueueOfflineAction = useCallback(
    (action: Omit<OfflineAction, 'id' | 'timestamp'>) => {
      const queue = getQueue()
      const newAction: OfflineAction = {
        ...action,
        id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
      }
      queue.push(newAction)
      saveQueue(queue)
      toast('💾 Acción guardada localmente (modo sin conexión)', {
        icon: '⚡',
        duration: 2500,
      })
    },
    [getQueue, saveQueue]
  )

  // Procesar y vaciar la cola cuando se recupera la conexión
  const processSyncQueue = useCallback(async () => {
    const queue = getQueue()
    if (queue.length === 0) return

    toast.loading(`Sincronizando ${queue.length} cambios pendientes...`, { id: 'offline-sync' })

    let processedCount = 0
    const remainingQueue: OfflineAction[] = []

    for (const item of queue) {
      try {
        if (item.type === 'update_status') {
          await updateTaskStatus(item.taskId, item.payload.status)
          processedCount++
        } else if (item.type === 'update_task') {
          await updateTask(item.taskId, item.payload)
          processedCount++
        }
      } catch (err) {
        console.warn('[OfflineSync] Error sincronizando elemento:', item, err)
        remainingQueue.push(item)
      }
    }

    saveQueue(remainingQueue)
    toast.dismiss('offline-sync')

    if (processedCount > 0) {
      soundEngine.playSuccessChime()
      triggerConfetti()
      toast.success(
        `🟢 ¡Conexión restablecida! Se sincronizaron ${processedCount} cambios pendientes.`,
        { icon: '🚀', duration: 4000 }
      )
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }
  }, [getQueue, saveQueue, queryClient])

  useEffect(() => {
    setPendingCount(getQueue().length)

    const handleOnline = () => {
      setIsOnline(true)
      processSyncQueue()
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.error('⚡ Has perdido la conexión a internet. AgendaPro continuará funcionando en modo offline.', {
        duration: 4000,
        icon: '📡',
      })
    }

    const handleQueueUpdate = () => {
      setPendingCount(getQueue().length)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('agendapro_offline_queue_updated', handleQueueUpdate)

    // Si al cargar ya hay conexión y elementos en cola, procesarlos
    if (navigator.onLine && getQueue().length > 0) {
      processSyncQueue()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('agendapro_offline_queue_updated', handleQueueUpdate)
    }
  }, [getQueue, processSyncQueue])

  return {
    isOnline,
    pendingCount,
    enqueueOfflineAction,
    processSyncQueue,
  }
}
