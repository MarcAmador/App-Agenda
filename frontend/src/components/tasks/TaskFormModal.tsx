import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Dropdown } from 'primereact/dropdown'
import { Calendar } from 'primereact/calendar'
import { Chips } from 'primereact/chips'
import {
  X,
  ListChecks,
  Link2,
  Plus,
  Trash2,
  ExternalLink,
  Folder,
  Video,
  BookOpen,
  Globe,
  CheckCircle2,
  Circle,
  Bookmark,
  Sparkles,
  Users,
  Package,
  EyeOff,
} from 'lucide-react'
import { TaskTemplatesModal } from './TaskTemplatesModal'
import { saveCustomTemplate, type AcademicTaskTemplate } from '@/utils/taskTemplates'
import { breakdownTaskWithAI } from '@/utils/taskBreakdownAI'
import { soundEngine } from '@/utils/audioEffects'
import { useUiPreferences } from '@/context/UiPreferencesContext'
import toast from 'react-hot-toast'
import type {
  Task,
  CreateTaskInput,
  TaskStatus,
  TaskPriority,
  TaskScope,
  TaskSubtask,
  TaskLink,
  TaskLinkType,
} from '@/types/database.types'
import { PRIORITY_META, SCOPE_META, STATUS_META } from '@/types/database.types'

// ─── Opciones de selects ──────────────────────────────────────────────────────

const STATUS_OPTIONS: { label: string; value: TaskStatus }[] = (
  Object.entries(STATUS_META) as [TaskStatus, (typeof STATUS_META)[TaskStatus]][]
).map(([value, m]) => ({ label: m.label, value }))

const PRIORITY_OPTIONS: { label: string; value: TaskPriority; description: string }[] = (
  Object.entries(PRIORITY_META) as [TaskPriority, (typeof PRIORITY_META)[TaskPriority]][]
).map(([value, m]) => ({ label: m.label, value, description: m.description }))

const SCOPE_OPTIONS: { label: string; value: TaskScope }[] = (
  Object.entries(SCOPE_META) as [TaskScope, (typeof SCOPE_META)[TaskScope]][]
).map(([value, m]) => ({ label: m.label, value }))

const CATEGORY_OPTIONS = [
  'Reunión', 'Examen', 'Entrega de notas', 'Planificación', 'Capacitación',
  'Seguimiento', 'Revisión', 'Administrativo', 'Otro',
].map((c) => ({ label: c, value: c }))

const LOCATION_OPTIONS = [
  { label: 'Presencial', value: 'Presencial' },
  { label: 'Virtual (Meet/Zoom)', value: 'Virtual' },
  { label: 'Híbrido', value: 'Híbrido' },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface TaskFormModalProps {
  visible: boolean
  task?: Task | null          // Si se proporciona, es modo edición
  initialValues?: Partial<CreateTaskInput> | null // Valores prellenados para nueva tarea
  onHide: () => void
  onSubmit: (data: CreateTaskInput) => void
  isSubmitting?: boolean
}

type FormValues = {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  scope_period: TaskScope
  due_date: Date | null
  due_time: Date | null
  start_time: Date | null
  end_time: Date | null
  location: string
  category: string
  tags: string[]
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function TaskFormModal({ visible, task, initialValues, onHide, onSubmit, isSubmitting }: TaskFormModalProps) {
  const isEditing = !!task
  const { preferences } = useUiPreferences()

  // Control para mostrar u ocultar opciones avanzadas en el modal
  const [hideTemplatesManual, setHideTemplatesManual] = useState(false)
  const [hideAiManual, setHideAiManual] = useState(false)

  const showTemplates = preferences.showNewTaskTemplates && !hideTemplatesManual
  const showAI = preferences.showNewTaskAI && !hideAiManual

  // Estado para subtareas (Checklist)
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>([])
  const [newSubtaskText, setNewSubtaskText] = useState('')

  // Estado para Participantes y Materiales
  const [participants, setParticipants] = useState<string[]>([])
  const [newParticipant, setNewParticipant] = useState('')
  const [materials, setMaterials] = useState<string[]>([])
  const [newMaterial, setNewMaterial] = useState('')

  // Estado para enlaces a recursos (Drive, Meet, Classroom, etc.)
  const [links, setLinks] = useState<TaskLink[]>([])
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [templatesModalVisible, setTemplatesModalVisible] = useState(false)
  const [isBreakingDown, setIsBreakingDown] = useState(false)

  const { control, handleSubmit, reset, getValues, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      title: '',
      description: '',
      status: 'pendiente',
      priority: 'importante_no_urgente',
      scope_period: 'semanal',
      due_date: null,
      due_time: null,
      start_time: null,
      end_time: null,
      location: '',
      category: '',
      tags: [],
    },
  })

  // Poblar el formulario al abrir en modo edición o con valores iniciales
  useEffect(() => {
    if (task) {
      reset({
        title:        task.title,
        description:  task.description ?? '',
        status:       task.status,
        priority:     task.priority,
        scope_period: task.scope_period,
        due_date:     task.due_date ? new Date(task.due_date + 'T00:00:00') : null,
        due_time:     task.due_time ? new Date(`1970-01-01T${task.due_time}`) : null,
        start_time:   task.start_time ? new Date(`1970-01-01T${task.start_time}`) : (task.due_time ? new Date(`1970-01-01T${task.due_time}`) : null),
        end_time:     task.end_time ? new Date(`1970-01-01T${task.end_time}`) : null,
        location:     task.location ?? '',
        category:     task.category ?? '',
        tags:         task.tags ?? [],
      })
      setSubtasks(task.checklist || [])
      setLinks(task.links || [])
      setParticipants(task.participants || [])
      setMaterials(task.materials || [])
    } else {
      reset({
        title: '',
        description: '',
        status: initialValues?.status ?? 'pendiente',
        priority: initialValues?.priority ?? 'importante_no_urgente',
        scope_period: initialValues?.scope_period ?? 'semanal',
        due_date: initialValues?.due_date ? new Date(initialValues.due_date + 'T00:00:00') : null,
        due_time: null,
        start_time: null,
        end_time: null,
        location: initialValues?.location ?? '',
        category: initialValues?.category ?? '',
        tags: initialValues?.tags ?? [],
      })
      setSubtasks(initialValues?.checklist || [])
      setLinks(initialValues?.links || [])
      setParticipants(initialValues?.participants || [])
      setMaterials(initialValues?.materials || [])
      setNewSubtaskText('')
      setNewLinkUrl('')
      setNewLinkTitle('')
      setNewParticipant('')
      setNewMaterial('')
    }
  }, [task, initialValues, reset, visible])

  // ── Manejo de Plantillas ───────────────────────────────────────────────────
  const handleSelectTemplate = (tpl: AcademicTaskTemplate) => {
    reset({
      title: tpl.title,
      description: tpl.description,
      status: 'pendiente',
      priority: tpl.priority,
      scope_period: tpl.scope_period,
      due_date: new Date(),
      due_time: null,
      location: '',
      category: tpl.category,
      tags: tpl.tags || [],
    })
    setSubtasks(
      tpl.subtasks.map((s) => ({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()),
        text: s.text,
        completed: false,
      }))
    )
    if (tpl.materials?.length) {
      setMaterials(tpl.materials)
    }
    if (tpl.participants?.length) {
      setParticipants(tpl.participants)
    }
    toast.success(`Plantilla "${tpl.title}" cargada con éxito`, { icon: '✨' })
  }

  const handleSaveAsTemplate = () => {
    const currentValues = getValues()
    if (!currentValues.title || !currentValues.title.trim()) {
      toast.error('Ingresa al menos un título para crear una plantilla')
      return
    }

    saveCustomTemplate({
      title: currentValues.title.trim(),
      description: currentValues.description || '',
      category: currentValues.category || 'general',
      priority: currentValues.priority,
      scope_period: currentValues.scope_period,
      tags: currentValues.tags || [],
      materials: materials,
      participants: participants,
      subtasks: subtasks.map((s) => ({ id: s.id, text: s.text, completed: false })),
    })

    toast.success('¡Plantilla personalizada guardada con éxito!', { icon: '💾' })
  }

  // ── Desglose Inteligente con IA ─────────────────────────────────────────────
  const handleAIBreakdown = async () => {
    const currentValues = getValues()
    if (!currentValues.title || !currentValues.title.trim()) {
      toast.error('Escribe primero el título de la tarea para poder desglosarla con IA')
      return
    }

    try {
      setIsBreakingDown(true)
      const result = await breakdownTaskWithAI({
        title: currentValues.title,
        description: currentValues.description,
        category: currentValues.category,
      })

      const newItems: TaskSubtask[] = result.subtasks.map((text) => ({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        text,
        completed: false,
      }))

      setSubtasks((prev) => [...prev, ...newItems])
      if (result.suggestedMaterials?.length) {
        setMaterials((prev) => Array.from(new Set([...prev, ...result.suggestedMaterials])))
      }
      if (!currentValues.category && result.suggestedCategory) {
        setValue('category', result.suggestedCategory)
      }
      if ((!currentValues.tags || currentValues.tags.length === 0) && result.suggestedTags?.length) {
        setValue('tags', result.suggestedTags)
      }
      soundEngine.playSuccessChime()
      toast.success(
        `✨ ¡${result.subtasks.length} pasos y materiales generados con IA! (~${result.estimatedTotalMinutes} min)`,
        { duration: 4000 }
      )
    } catch {
      toast.error('Error al generar desglose con IA')
    } finally {
      setIsBreakingDown(false)
    }
  }

  // ── Manejo de Subtareas ─────────────────────────────────────────────────────
  const handleAddSubtask = () => {
    const text = newSubtaskText.trim()
    if (!text) return
    const newItem: TaskSubtask = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      text,
      completed: false,
    }
    setSubtasks((prev) => [...prev, newItem])
    setNewSubtaskText('')
  }

  const handleToggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    )
  }

  const handleRemoveSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id))
  }

  // ── Manejo de Enlaces de Recursos ───────────────────────────────────────────
  const detectLinkType = (url: string): TaskLinkType => {
    const u = url.toLowerCase()
    if (u.includes('drive.google.com') || u.includes('docs.google.com')) return 'drive'
    if (u.includes('meet.google.com')) return 'meet'
    if (u.includes('classroom.google.com')) return 'classroom'
    if (u.includes('teams.microsoft.com')) return 'teams'
    if (u.includes('zoom.us')) return 'zoom'
    return 'link'
  }

  const getLinkIcon = (type: TaskLinkType) => {
    switch (type) {
      case 'drive':
        return <Folder className="w-3.5 h-3.5 text-amber-500" />
      case 'meet':
        return <Video className="w-3.5 h-3.5 text-emerald-500" />
      case 'classroom':
        return <BookOpen className="w-3.5 h-3.5 text-green-600" />
      case 'teams':
        return <Video className="w-3.5 h-3.5 text-indigo-500" />
      case 'zoom':
        return <Video className="w-3.5 h-3.5 text-blue-500" />
      default:
        return <Globe className="w-3.5 h-3.5 text-primary" />
    }
  }

  const handleAddLink = () => {
    let url = newLinkUrl.trim()
    if (!url) return
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url
    }
    const type = detectLinkType(url)
    let title = newLinkTitle.trim()
    if (!title) {
      if (type === 'drive') title = 'Google Drive'
      else if (type === 'meet') title = 'Google Meet'
      else if (type === 'classroom') title = 'Google Classroom'
      else if (type === 'teams') title = 'Microsoft Teams'
      else if (type === 'zoom') title = 'Reunión Zoom'
      else {
        try {
          title = new URL(url).hostname.replace('www.', '')
        } catch {
          title = 'Enlace de recurso'
        }
      }
    }
    const newLink: TaskLink = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      title,
      url,
      type,
    }
    setLinks((prev) => [...prev, newLink])
    setNewLinkUrl('')
    setNewLinkTitle('')
  }

  const handleRemoveLink = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id))
  }

  // ── Envío del Formulario ────────────────────────────────────────────────────
  const handleFormSubmit = (values: FormValues) => {
    let formattedDate: string | null = null
    if (values.due_date) {
      const y = values.due_date.getFullYear()
      const m = String(values.due_date.getMonth() + 1).padStart(2, '0')
      const d = String(values.due_date.getDate()).padStart(2, '0')
      formattedDate = `${y}-${m}-${d}`
    }

    const effectiveStartTime = values.start_time || values.due_time
    const formattedStartTime = effectiveStartTime
      ? `${String(effectiveStartTime.getHours()).padStart(2, '0')}:${String(effectiveStartTime.getMinutes()).padStart(2, '0')}:00`
      : null
    const formattedEndTime = values.end_time
      ? `${String(values.end_time.getHours()).padStart(2, '0')}:${String(values.end_time.getMinutes()).padStart(2, '0')}:00`
      : null

    const payload: CreateTaskInput = {
      title:        values.title,
      description:  values.description || null,
      status:       values.status,
      priority:     values.priority,
      scope_period: values.scope_period,
      due_date:     formattedDate,
      due_time:     formattedStartTime,
      start_time:   formattedStartTime,
      end_time:     formattedEndTime,
      location:     values.location || null,
      category:     values.category || null,
      tags:         values.tags,
      participants: participants,
      materials:    materials,
      is_shared:    false,
      shared_with:  [],
      checklist:    subtasks,
      links:        links,
    }
    onSubmit(payload)
  }

  const header = (
    <div className="flex items-center justify-between pr-2">
      <div>
        <h3 className="text-base font-semibold text-base-content">
          {isEditing ? 'Editar Tarea' : 'Nueva Tarea'}
        </h3>
        <p className="text-xs text-base-content/50 mt-0.5">
          {isEditing ? 'Modifica los detalles de la actividad' : 'Completa los detalles de la nueva actividad'}
        </p>
      </div>
      <button
        id="tour-modal-close-btn"
        onClick={onHide}
        className="btn btn-ghost btn-sm btn-circle"
        aria-label="Cerrar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )

  const priorityTemplate = (option: (typeof PRIORITY_OPTIONS)[number]) => (
    <div className="flex flex-col gap-0.5 py-0.5">
      <span className="text-sm font-medium">{option.label}</span>
      <span className="text-xs text-base-content/50">{option.description}</span>
    </div>
  )

  const completedSubtasksCount = subtasks.filter((s) => s.completed).length

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={header}
      className="w-full max-w-2xl"
      modal
      draggable={false}
      resizable={false}
      closable={false}
      style={{ borderRadius: '1rem' }}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5 pt-2">

        {/* Banner de Plantillas para Nuevas Tareas */}
        {!isEditing && showTemplates && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-primary/10 via-base-200 to-secondary/10 border border-primary/20 gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-semibold text-base-content truncate">
                ¿Deseas ahorrar tiempo con una rutina docente prediseñada?
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setTemplatesModalVisible(true)}
                className="btn btn-primary btn-xs rounded-lg gap-1.5 shadow-xs font-semibold"
              >
                <Bookmark className="w-3 h-3" />
                <span>Usar Plantilla</span>
              </button>
              <button
                type="button"
                onClick={() => setHideTemplatesManual(true)}
                className="btn btn-ghost btn-circle btn-xs text-base-content/40 hover:text-base-content"
                title="Ocultar sugerencia de plantillas"
              >
                <EyeOff className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* 1. Título */}
        <div id="tour-modal-title" className="form-control gap-1.5">
          <label className="label-text font-medium text-sm">
            Título <span className="text-error">*</span>
          </label>
          <Controller
            name="title"
            control={control}
            rules={{ required: 'El título es requerido', maxLength: { value: 255, message: 'Máximo 255 caracteres' } }}
            render={({ field }) => (
              <InputText
                {...field}
                placeholder="Ej: Entrega de notas bimestre 1"
                className={`p-inputtext-sm w-full ${errors.title ? 'p-invalid' : ''}`}
              />
            )}
          />
          {errors.title && <span className="text-error text-xs">{errors.title.message}</span>}
        </div>

        {/* 2. Descripción con Contador de Caracteres & Tiempo de Lectura */}
        <div id="tour-modal-description" className="form-control gap-1.5">
          <div className="flex items-center justify-between">
            <label className="label-text font-medium text-sm">Descripción</label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => {
                const text = field.value || ''
                const charCount = text.length
                const words = text.trim().split(/\s+/).filter(Boolean).length
                const readMinutes = Math.max(1, Math.ceil(words / 160))

                return (
                  <div className="flex items-center gap-2 text-[11px] text-base-content/50">
                    {words >= 15 && (
                      <span className="badge badge-ghost badge-xs py-0.5 px-1.5 text-[10px]">
                        ~{readMinutes} min de lectura
                      </span>
                    )}
                    <span className={charCount > 1800 ? 'text-warning font-semibold' : ''}>
                      {charCount} / 2,000
                    </span>
                  </div>
                )
              }}
            />
          </div>
          <Controller
            name="description"
            control={control}
            rules={{ maxLength: { value: 2000, message: 'Máximo 2,000 caracteres' } }}
            render={({ field }) => (
              <InputTextarea
                {...field}
                rows={3}
                placeholder="Detalles adicionales de la actividad..."
                className="p-inputtext-sm w-full resize-none"
              />
            )}
          />
        </div>

        {/* 3. Fila: Estado + Prioridad */}
        <div id="tour-modal-priority" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-control gap-1.5">
            <label className="label-text font-medium text-sm">Estado</label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Dropdown
                  {...field}
                  options={STATUS_OPTIONS}
                  optionLabel="label"
                  optionValue="value"
                  className="p-inputtext-sm w-full"
                />
              )}
            />
          </div>
          <div className="form-control gap-1.5">
            <label className="label-text font-medium text-sm">
              Prioridad (Matriz Eisenhower)
            </label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Dropdown
                  {...field}
                  options={PRIORITY_OPTIONS}
                  optionLabel="label"
                  optionValue="value"
                  itemTemplate={priorityTemplate}
                  className="p-inputtext-sm w-full"
                />
              )}
            />
          </div>
        </div>

        {/* 4. Fila: Fecha + Hora de Inicio + Hora Fin */}
        <div id="tour-modal-dates" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="form-control gap-1.5">
            <label className="label-text font-medium text-sm">Fecha</label>
            <Controller
              name="due_date"
              control={control}
              render={({ field }) => (
                <Calendar
                  {...field}
                  dateFormat="dd/mm/yy"
                  placeholder="dd/mm/aaaa"
                  showButtonBar
                  className="p-inputtext-sm w-full"
                  inputClassName="w-full"
                  showIcon
                />
              )}
            />
          </div>
          <div className="form-control gap-1.5">
            <label className="label-text font-medium text-sm">Hora de Inicio</label>
            <Controller
              name="start_time"
              control={control}
              render={({ field }) => (
                <Calendar
                  {...field}
                  timeOnly
                  hourFormat="12"
                  placeholder="HH:MM"
                  className="p-inputtext-sm w-full"
                  inputClassName="w-full"
                  showIcon
                  icon="pi pi-clock"
                />
              )}
            />
          </div>
          <div className="form-control gap-1.5">
            <label className="label-text font-medium text-sm flex items-center justify-between">
              <span>Hora Fin</span>
              <span className="text-[10px] text-base-content/50 font-normal">Opcional</span>
            </label>
            <Controller
              name="end_time"
              control={control}
              render={({ field }) => (
                <Calendar
                  {...field}
                  timeOnly
                  hourFormat="12"
                  placeholder="HH:MM"
                  className="p-inputtext-sm w-full"
                  inputClassName="w-full"
                  showIcon
                  icon="pi pi-clock"
                />
              )}
            />
          </div>
        </div>

        {/* 5. Subtareas / Checklist (Joya 1) */}
        <div id="tour-modal-subtasks" className="card bg-base-200/50 border border-base-300/70 p-4 rounded-2xl flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <ListChecks className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-base-content uppercase tracking-wider">
                Subtareas / Pasos de la Actividad
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Botón Desglosar con IA */}
              {showAI && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={isBreakingDown}
                    onClick={handleAIBreakdown}
                    className="btn btn-primary btn-xs rounded-lg gap-1.5 font-semibold shadow-2xs hover:shadow-xs"
                    title="Descomponer automáticamente esta tarea en pasos y materiales sugeridos con IA"
                  >
                    {isBreakingDown ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-primary-content" />
                    )}
                    <span>Desglosar con IA</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHideAiManual(true)}
                    className="btn btn-ghost btn-circle btn-xs text-base-content/40 hover:text-base-content"
                    title="Ocultar asistente de IA"
                  >
                    <EyeOff className="w-3 h-3" />
                  </button>
                </div>
              )}

              {subtasks.length > 0 && (
                <span className="badge badge-primary badge-outline badge-xs font-semibold py-1">
                  {completedSubtasksCount} de {subtasks.length} ({Math.round((completedSubtasksCount / subtasks.length) * 100)}%)
                </span>
              )}
            </div>
          </div>

          {subtasks.length > 0 && (
            <div className="w-full bg-base-300 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${Math.round((completedSubtasksCount / subtasks.length) * 100)}%` }}
              />
            </div>
          )}

          {/* Lista de subtareas */}
          {subtasks.length > 0 && (
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-base-100 border border-base-200 hover:border-primary/30 transition-all text-xs group"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleSubtask(st.id)}
                    className="flex items-center gap-2.5 text-left flex-1 cursor-pointer"
                  >
                    {st.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-base-content/30 group-hover:text-primary flex-shrink-0" />
                    )}
                    <span className={st.completed ? 'line-through text-base-content/40' : 'text-base-content font-medium'}>
                      {st.text}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(st.id)}
                    className="btn btn-ghost btn-xs btn-circle opacity-50 hover:opacity-100 hover:text-error"
                    title="Eliminar paso"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input para agregar subtarea */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newSubtaskText}
              onChange={(e) => setNewSubtaskText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddSubtask()
                }
              }}
              placeholder="Escribe un paso y presiona Enter..."
              className="input input-bordered input-sm w-full text-xs rounded-xl"
            />
            <button
              type="button"
              onClick={handleAddSubtask}
              className="btn btn-sm btn-primary rounded-xl gap-1 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir</span>
            </button>
          </div>
        </div>

        {/* 6. Enlaces y Recursos de Apoyo (Joya 2) */}
        <div id="tour-modal-links" className="card bg-base-200/50 border border-base-300/70 p-4 rounded-2xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-info/10 text-info flex items-center justify-center">
                <Link2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-base-content uppercase tracking-wider">
                Recursos & Enlaces Rápidos (Drive, Meet, Teams)
              </span>
            </div>
            {links.length > 0 && (
              <span className="badge badge-ghost badge-xs text-[10px] font-semibold">
                {links.length} recurso(s)
              </span>
            )}
          </div>

          {/* Lista de enlaces existentes */}
          {links.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {links.map((lnk) => (
                <div
                  key={lnk.id}
                  className="flex items-center gap-1.5 bg-base-100 border border-base-200 px-2.5 py-1.5 rounded-xl text-xs shadow-xs"
                >
                  {getLinkIcon(lnk.type)}
                  <a
                    href={lnk.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline flex items-center gap-1 max-w-[180px] truncate"
                    title={lnk.url}
                  >
                    <span>{lnk.title}</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveLink(lnk.id)}
                    className="btn btn-ghost btn-xs btn-circle ml-1 opacity-50 hover:opacity-100 hover:text-error"
                    title="Eliminar recurso"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Inputs para nuevo enlace */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            <input
              type="text"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              placeholder="URL (ej: drive.google.com o meet.google.com)..."
              className="input input-bordered input-sm text-xs rounded-xl sm:col-span-3"
            />
            <input
              type="text"
              value={newLinkTitle}
              onChange={(e) => setNewLinkTitle(e.target.value)}
              placeholder="Título opcional..."
              className="input input-bordered input-sm text-xs rounded-xl sm:col-span-1"
            />
            <button
              type="button"
              onClick={handleAddLink}
              className="btn btn-sm btn-outline btn-info rounded-xl gap-1 text-xs sm:col-span-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ligar</span>
            </button>
          </div>
        </div>

        {/* 7. Fila: Alcance + Categoría + Ubicación + Etiquetas */}
        <div id="tour-modal-meta" className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control gap-1.5">
              <label className="label-text font-medium text-sm">Alcance temporal</label>
              <Controller
                name="scope_period"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    {...field}
                    options={SCOPE_OPTIONS}
                    optionLabel="label"
                    optionValue="value"
                    className="p-inputtext-sm w-full"
                  />
                )}
              />
            </div>
            <div className="form-control gap-1.5">
              <label className="label-text font-medium text-sm">Categoría</label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    {...field}
                    options={CATEGORY_OPTIONS}
                    optionLabel="label"
                    optionValue="value"
                    editable
                    placeholder="Selecciona o escribe..."
                    className="p-inputtext-sm w-full"
                  />
                )}
              />
            </div>
          </div>

          {/* Ubicación */}
          <div className="form-control gap-1.5">
            <label className="label-text font-medium text-sm">Modalidad / Lugar</label>
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <Dropdown
                  {...field}
                  options={LOCATION_OPTIONS}
                  optionLabel="label"
                  optionValue="value"
                  editable
                  placeholder="Selecciona o escribe la ubicación..."
                  className="p-inputtext-sm w-full"
                />
              )}
            />
          </div>

          {/* Etiquetas */}
          <div className="form-control gap-1.5">
            <label className="label-text font-medium text-sm">Etiquetas</label>
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <Chips
                  {...field}
                  placeholder="Escribe y presiona Enter..."
                  className="w-full"
                  max={10}
                />
              )}
            />
            <span className="text-xs text-base-content/40">Presiona Enter para agregar cada etiqueta</span>
          </div>

          {/* 8. Participantes y Materiales de la Actividad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Participantes */}
            <div className="card bg-base-200/40 border border-base-300/60 p-3.5 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-base-content flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-500" />
                  <span>Participantes / Convocados</span>
                </span>
                <span className="text-[10px] text-base-content/50 font-medium">
                  {participants.length} añadido(s)
                </span>
              </div>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newParticipant}
                  onChange={(e) => setNewParticipant(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const val = newParticipant.trim()
                      if (val && !participants.includes(val)) {
                        setParticipants((p) => [...p, val])
                        setNewParticipant('')
                      }
                    }
                  }}
                  placeholder="Ej: Prof. López, 5to Primaria..."
                  className="input input-bordered input-xs rounded-lg text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = newParticipant.trim()
                    if (val && !participants.includes(val)) {
                      setParticipants((p) => [...p, val])
                      setNewParticipant('')
                    }
                  }}
                  className="btn btn-primary btn-xs rounded-lg px-2 font-semibold"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {participants.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1 max-h-24 overflow-y-auto">
                  {participants.map((p, idx) => (
                    <span
                      key={idx}
                      className="badge badge-sm bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20 gap-1 text-[11px]"
                    >
                      <span>{p}</span>
                      <button
                        type="button"
                        onClick={() => setParticipants((prev) => prev.filter((_, i) => i !== idx))}
                        className="hover:text-error ml-0.5 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Materiales */}
            <div className="card bg-base-200/40 border border-base-300/60 p-3.5 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-base-content flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-amber-500" />
                  <span>Materiales y Recursos</span>
                </span>
                <span className="text-[10px] text-base-content/50 font-medium">
                  {materials.length} añadido(s)
                </span>
              </div>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newMaterial}
                  onChange={(e) => setNewMaterial(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const val = newMaterial.trim()
                      if (val && !materials.includes(val)) {
                        setMaterials((m) => [...m, val])
                        setNewMaterial('')
                      }
                    }
                  }}
                  placeholder="Ej: Proyector, Hojas impresas..."
                  className="input input-bordered input-xs rounded-lg text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = newMaterial.trim()
                    if (val && !materials.includes(val)) {
                      setMaterials((m) => [...m, val])
                      setNewMaterial('')
                    }
                  }}
                  className="btn btn-warning btn-xs rounded-lg px-2 font-semibold"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {materials.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1 max-h-24 overflow-y-auto">
                  {materials.map((m, idx) => (
                    <span
                      key={idx}
                      className="badge badge-sm bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20 gap-1 text-[11px]"
                    >
                      <span>{m}</span>
                      <button
                        type="button"
                        onClick={() => setMaterials((prev) => prev.filter((_, i) => i !== idx))}
                        className="hover:text-error ml-0.5 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 9. Acciones */}
        <div id="tour-modal-actions" className="flex items-center justify-between gap-3 pt-3 border-t border-base-200 flex-wrap">
          <div>
            {!isEditing && (
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                className="btn btn-ghost btn-xs text-base-content/60 hover:text-primary gap-1.5"
                title="Guardar el título, categoría y subtareas actuales como una plantilla reutilizable"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Guardar como mi plantilla</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={onHide} className="btn btn-ghost btn-sm">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-sm min-w-24"
            >
              {isSubmitting
                ? <span className="loading loading-spinner loading-xs" />
                : isEditing ? 'Guardar cambios' : 'Crear tarea'
              }
            </button>
          </div>
        </div>

      </form>

      {/* ── Modal Catálogo de Plantillas Docentes ── */}
      <TaskTemplatesModal
        visible={templatesModalVisible}
        onHide={() => setTemplatesModalVisible(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </Dialog>
  )
}
