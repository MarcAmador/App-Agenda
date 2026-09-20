/**
 * TaskFormModal v3 — Modal ultra-premium inspirado en PrimePro Taskboard
 * Diseño: 2 paneles, gradientes, animaciones fluidas
 */
import { useState, useEffect, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import {
  X, Plus, Trash2, ExternalLink, CheckCircle2, Circle,
  Sparkles, EyeOff, Bookmark, ListChecks, Link2,
  ChevronDown, ChevronUp, CalendarDays, Clock,
  AlertCircle, Target, Zap, Layers, Tag, MapPin,
  Users, Package, Folder, Video, BookOpen, Globe,
  CheckSquare,
} from 'lucide-react'
import { TaskTemplatesModal } from './TaskTemplatesModal'
import { saveCustomTemplate, type AcademicTaskTemplate } from '@/utils/taskTemplates'
import { breakdownTaskWithAI } from '@/utils/taskBreakdownAI'
import { soundEngine } from '@/utils/audioEffects'
import { useUiPreferences } from '@/context/UiPreferencesContext'
import toast from 'react-hot-toast'
import type {
  Task, CreateTaskInput, TaskStatus, TaskPriority,
  TaskScope, TaskSubtask, TaskLink, TaskLinkType,
} from '@/types/database.types'
import { SCOPE_META } from '@/types/database.types'

// ─── Configuración ────────────────────────────────────────────────────────────

const STATUS_CONFIG: { label: string; value: TaskStatus; color: string; bg: string }[] = [
  { label: 'Pendiente',  value: 'pendiente',  color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-100 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/30' },
  { label: 'En curso',   value: 'en_curso',   color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-100 dark:bg-blue-500/15 border-blue-200 dark:border-blue-500/30' },
  { label: 'Completada', value: 'completada', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30' },
  { label: 'Perdida',    value: 'perdida',    color: 'text-rose-600 dark:text-rose-400',    bg: 'bg-rose-100 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/30' },
  { label: 'Anulada',    value: 'anulada',    color: 'text-slate-500',   bg: 'bg-slate-100 dark:bg-slate-500/15 border-slate-200 dark:border-slate-500/30' },
]

const PRIORITY_CONFIG: { label: string; value: TaskPriority; icon: React.ElementType; color: string; border: string; activeBg: string }[] = [
  { label: 'Urgente e Importante',   value: 'urgente_importante',    icon: AlertCircle, color: 'text-rose-500',    border: 'border-rose-400',    activeBg: 'bg-rose-50 dark:bg-rose-500/12 border-rose-300 dark:border-rose-500/40' },
  { label: 'Importante, No Urgente', value: 'importante_no_urgente', icon: Target,      color: 'text-emerald-500', border: 'border-emerald-400', activeBg: 'bg-emerald-50 dark:bg-emerald-500/12 border-emerald-300 dark:border-emerald-500/40' },
  { label: 'Urgente, No Importante', value: 'urgente_no_importante', icon: Zap,         color: 'text-amber-500',   border: 'border-amber-400',   activeBg: 'bg-amber-50 dark:bg-amber-500/12 border-amber-300 dark:border-amber-500/40' },
  { label: 'Baja Prioridad',         value: 'no_urgente_baja',       icon: Layers,      color: 'text-slate-400',   border: 'border-slate-300',   activeBg: 'bg-slate-50 dark:bg-slate-500/12 border-slate-300 dark:border-slate-500/30' },
]

const SCOPE_OPTIONS = (Object.entries(SCOPE_META) as [TaskScope, { label: string }][])
  .map(([value, m]) => ({ label: m.label, value }))

const CATEGORY_OPTIONS = [
  'Reunión', 'Examen', 'Entrega de notas', 'Planificación',
  'Capacitación', 'Seguimiento', 'Revisión', 'Administrativo', 'Otro',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectLinkType(url: string): TaskLinkType {
  const u = url.toLowerCase()
  if (u.includes('drive.google.com') || u.includes('docs.google.com')) return 'drive'
  if (u.includes('meet.google.com')) return 'meet'
  if (u.includes('classroom.google.com')) return 'classroom'
  if (u.includes('teams.microsoft.com')) return 'teams'
  if (u.includes('zoom.us')) return 'zoom'
  return 'link'
}

function getLinkIcon(type: TaskLinkType) {
  const cls = 'w-3.5 h-3.5 flex-shrink-0'
  const icons: Record<string, JSX.Element> = {
    drive:     <Folder   className={`${cls} text-amber-500`} />,
    meet:      <Video    className={`${cls} text-emerald-500`} />,
    classroom: <BookOpen className={`${cls} text-green-600`} />,
    teams:     <Video    className={`${cls} text-indigo-500`} />,
    zoom:      <Video    className={`${cls} text-blue-500`} />,
    link:      <Globe    className={`${cls} text-primary`} />,
  }
  return icons[type] ?? icons.link
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaskFormModalProps {
  visible: boolean
  task?: Task | null
  initialValues?: Partial<CreateTaskInput> | null
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
  due_date: string
  start_time: string
  end_time: string
  category: string
  location: string
  tags: string
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function TaskFormModal({
  visible, task, initialValues, onHide, onSubmit, isSubmitting,
}: TaskFormModalProps) {
  const isEditing = !!task
  const { preferences, isFeatureAvailable } = useUiPreferences()

  const [showMore, setShowMore] = useState(false)
  const [hideAI, setHideAI] = useState(false)
  const [templatesVisible, setTemplatesVisible] = useState(false)
  const [isBreaking, setIsBreaking] = useState(false)

  const showAI = isFeatureAvailable('showNewTaskAI') && preferences.showNewTaskAI && !hideAI
  const showTemplates = isFeatureAvailable('showNewTaskTemplates') && preferences.showNewTaskTemplates
  const showResources = isFeatureAvailable('showNewTaskResources') && preferences.showNewTaskResources
  const showParticipants = isFeatureAvailable('showNewTaskParticipants') && preferences.showNewTaskParticipants
  const showMaterials = isFeatureAvailable('showNewTaskMaterials') && preferences.showNewTaskMaterials

  const [subtasks, setSubtasks] = useState<TaskSubtask[]>([])
  const [newSub, setNewSub] = useState('')
  const subRef = useRef<HTMLInputElement>(null)

  const [participants, setParticipants] = useState<string[]>([])
  const [newParticipant, setNewParticipant] = useState('')
  const [materials, setMaterials] = useState<string[]>([])
  const [newMaterial, setNewMaterial] = useState('')

  const [links, setLinks] = useState<TaskLink[]>([])
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const { control, handleSubmit, reset, getValues, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      title: '', description: '',
      status: 'pendiente', priority: 'importante_no_urgente',
      scope_period: 'semanal', due_date: '', start_time: '', end_time: '',
      category: '', location: '', tags: '',
    },
  })

  const watchedPriority = watch('priority')
  const watchedStatus = watch('status')

  useEffect(() => {
    if (!visible) return
    setShowMore(false)
    if (task) {
      reset({
        title: task.title,
        description: task.description ?? '',
        status: task.status,
        priority: task.priority,
        scope_period: task.scope_period,
        due_date: task.due_date ?? '',
        start_time: task.start_time?.slice(0, 5) ?? task.due_time?.slice(0, 5) ?? '',
        end_time: task.end_time?.slice(0, 5) ?? '',
        category: task.category ?? '',
        location: task.location ?? '',
        tags: '',
      })
      setSubtasks(task.checklist || [])
      setLinks(task.links || [])
      setParticipants(task.participants || [])
      setMaterials(task.materials || [])
      setTags(task.tags || [])
    } else {
      reset({
        title: '', description: '',
        status: initialValues?.status ?? 'pendiente',
        priority: initialValues?.priority ?? 'importante_no_urgente',
        scope_period: initialValues?.scope_period ?? 'semanal',
        due_date: initialValues?.due_date ?? '',
        start_time: '', end_time: '',
        category: initialValues?.category ?? '',
        location: '', tags: '',
      })
      setSubtasks(initialValues?.checklist || [])
      setLinks(initialValues?.links || [])
      setParticipants(initialValues?.participants || [])
      setMaterials(initialValues?.materials || [])
      setTags(initialValues?.tags || [])
      setNewSub(''); setNewLinkUrl(''); setNewLinkTitle('')
      setNewParticipant(''); setNewMaterial('')
    }
  }, [task, initialValues, reset, visible])

  // Template
  const handleSelectTemplate = (tpl: AcademicTaskTemplate) => {
    reset({
      title: tpl.title, description: tpl.description || '',
      status: 'pendiente', priority: tpl.priority,
      scope_period: tpl.scope_period,
      due_date: '', start_time: '', end_time: '',
      category: tpl.category || '', location: '', tags: '',
    })
    setSubtasks(tpl.subtasks.map((s) => ({
      id: crypto.randomUUID?.() ?? String(Math.random()),
      text: s.text, completed: false,
    })))
    if (tpl.materials?.length) setMaterials(tpl.materials)
    if (tpl.participants?.length) setParticipants(tpl.participants)
    setTags(tpl.tags || [])
    toast.success(`Plantilla "${tpl.title}" cargada ✨`)
  }

  // AI
  const handleAI = async () => {
    const v = getValues()
    if (!v.title?.trim()) { toast.error('Escribe primero el título'); return }
    try {
      setIsBreaking(true)
      const res = await breakdownTaskWithAI({ title: v.title, description: v.description, category: v.category })
      const items: TaskSubtask[] = res.subtasks.map((text) => ({
        id: crypto.randomUUID?.() ?? String(Date.now() + Math.random()),
        text, completed: false,
      }))
      setSubtasks((p) => [...p, ...items])
      if (res.suggestedMaterials?.length) setMaterials((p) => Array.from(new Set([...p, ...res.suggestedMaterials])))
      if (!v.category && res.suggestedCategory) setValue('category', res.suggestedCategory)
      if (!tags.length && res.suggestedTags?.length) setTags(res.suggestedTags)
      soundEngine.playSuccessChime()
      toast.success(`✨ ${res.subtasks.length} pasos generados (~${res.estimatedTotalMinutes} min)`)
    } catch { toast.error('Error al generar pasos con IA') }
    finally { setIsBreaking(false) }
  }

  // Subtasks
  const addSub = () => {
    const t = newSub.trim(); if (!t) return
    setSubtasks((p) => [...p, { id: crypto.randomUUID?.() ?? String(Date.now()), text: t, completed: false }])
    setNewSub(''); subRef.current?.focus()
  }

  // Links
  const addLink = () => {
    let url = newLinkUrl.trim(); if (!url) return
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url
    const type = detectLinkType(url)
    const title = newLinkTitle.trim() || (new URL(url).hostname.replace('www.', '') || 'Enlace')
    setLinks((p) => [...p, { id: crypto.randomUUID?.() ?? String(Date.now()), title, url, type }])
    setNewLinkUrl(''); setNewLinkTitle('')
  }

  // Tags
  const addTag = (val: string) => {
    const t = val.trim(); if (!t || tags.includes(t)) return
    setTags((p) => [...p, t])
    setTagInput('')
  }

  // Submit
  const handleFormSubmit = (values: FormValues) => {
    const fmtTime = (s: string) => s ? `${s}:00` : null
    const payload: CreateTaskInput = {
      title: values.title,
      description: values.description || null,
      status: values.status,
      priority: values.priority,
      scope_period: values.scope_period,
      due_date: values.due_date || null,
      due_time: fmtTime(values.start_time),
      start_time: fmtTime(values.start_time),
      end_time: fmtTime(values.end_time),
      location: values.location || null,
      category: values.category || null,
      tags,
      participants,
      materials,
      is_shared: false,
      shared_with: [],
      checklist: subtasks,
      links,
    }
    onSubmit(payload)
  }

  const completedSubs = subtasks.filter((s) => s.completed).length
  const progress = subtasks.length > 0 ? Math.round((completedSubs / subtasks.length) * 100) : 0
  const currentStatus = STATUS_CONFIG.find((s) => s.value === watchedStatus)
  const currentPriority = PRIORITY_CONFIG.find((p) => p.value === watchedPriority)

  if (!visible) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onHide() }}
      >
        <div
          className="bg-base-100 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden border border-base-300 dark:border-base-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Modal Header ──────────────────────────────────────── */}
          <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-base-200 shrink-0 bg-base-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-base-content">
                  {isEditing ? 'Editar tarea' : 'Nueva tarea'}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  {currentStatus && (
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${currentStatus.bg} ${currentStatus.color}`}>
                      {currentStatus.label}
                    </span>
                  )}
                  {currentPriority && (
                    <>
                      <span className="text-base-content/20">·</span>
                      <span className={`text-[11px] font-semibold ${currentPriority.color}`}>
                        {currentPriority.label}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {showTemplates && (
                <button
                  type="button"
                  onClick={() => setTemplatesVisible(true)}
                  className="btn btn-xs btn-outline btn-primary rounded-xl gap-1.5 font-semibold hidden sm:inline-flex"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  Plantillas
                </button>
              )}
              <button
                onClick={onHide}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-base-200 text-base-content/50 hover:text-base-content transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Modal Form: Body Panels + Static Footer ── */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Split Content Body (Mobile: Columna única scrolleable | Desktop: 2 Columnas) */}
            <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-y-auto md:overflow-hidden">

              {/* Panel principal */}
              <div className="flex-1 flex flex-col md:overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 gap-4 sm:gap-5">

                {/* Título */}
                <Controller
                  name="title"
                  control={control}
                  rules={{ required: 'El título es requerido' }}
                  render={({ field }) => (
                    <div>
                      <input
                        {...field}
                        type="text"
                        placeholder="¿Qué hay que hacer?"
                        autoFocus
                        className="w-full text-xl font-bold bg-transparent border-0 outline-none placeholder:text-base-content/25 text-base-content caret-primary"
                      />
                      {errors.title && (
                        <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.title.message}
                        </p>
                      )}
                    </div>
                  )}
                />

                {/* Descripción */}
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={2}
                      placeholder="Descripción o notas adicionales..."
                      className="w-full text-sm bg-transparent border-0 outline-none resize-none placeholder:text-base-content/25 text-base-content/80 leading-relaxed"
                    />
                  )}
                />

                {/* Status pills */}
                <div>
                  <p className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest mb-2">Estado</p>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-1.5">
                        {STATUS_CONFIG.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => field.onChange(s.value)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                              field.value === s.value
                                ? `${s.bg} ${s.color} shadow-xs`
                                : 'border-base-200 text-base-content/50 hover:border-base-300 hover:text-base-content'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </div>

                {/* Fecha y hora */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest flex items-center gap-1 mb-1.5">
                      <CalendarDays className="w-3 h-3" /> Fecha
                    </label>
                    <Controller
                      name="due_date"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="date"
                          className="input input-bordered input-sm w-full rounded-xl text-xs"
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest flex items-center gap-1 mb-1.5">
                      <Clock className="w-3 h-3" /> Inicio
                    </label>
                    <Controller
                      name="start_time"
                      control={control}
                      render={({ field }) => (
                        <input {...field} type="time" className="input input-bordered input-sm w-full rounded-xl text-xs" />
                      )}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest flex items-center gap-1 mb-1.5">
                      <Clock className="w-3 h-3" /> Fin
                    </label>
                    <Controller
                      name="end_time"
                      control={control}
                      render={({ field }) => (
                        <input {...field} type="time" className="input input-bordered input-sm w-full rounded-xl text-xs" />
                      )}
                    />
                  </div>
                </div>

                {/* Subtareas */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest flex items-center gap-1">
                      <ListChecks className="w-3 h-3" />
                      Pasos / Checklist
                      {subtasks.length > 0 && (
                        <span className="text-primary font-bold normal-case tracking-normal ml-1">
                          {completedSubs}/{subtasks.length} · {progress}%
                        </span>
                      )}
                    </p>
                    {showAI && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isBreaking}
                          onClick={handleAI}
                          className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:bg-primary/8 px-2 py-1 rounded-lg transition-colors"
                        >
                          {isBreaking ? <span className="loading loading-spinner loading-xs" /> : <Sparkles className="w-3 h-3" />}
                          Generar con IA
                        </button>
                        <button type="button" onClick={() => setHideAI(true)} className="text-base-content/25 hover:text-base-content/50 p-1 rounded">
                          <EyeOff className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Barra de progreso */}
                  {subtasks.length > 0 && (
                    <div className="h-1.5 bg-base-200 rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                  )}

                  {/* Lista */}
                  {subtasks.length > 0 && (
                    <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto mb-2 pr-1">
                      {subtasks.map((st) => (
                        <div key={st.id} className="flex items-center gap-2 group">
                          <button type="button" onClick={() => setSubtasks((p) => p.map((s) => s.id === st.id ? { ...s, completed: !s.completed } : s))}>
                            {st.completed
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                              : <Circle className="w-4 h-4 text-base-content/20 hover:text-primary flex-shrink-0 transition-colors" />
                            }
                          </button>
                          <span className={`text-xs flex-1 ${st.completed ? 'line-through text-base-content/30' : 'text-base-content/80'}`}>{st.text}</span>
                          <button
                            type="button"
                            onClick={() => setSubtasks((p) => p.filter((s) => s.id !== st.id))}
                            className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-all p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      ref={subRef}
                      type="text"
                      value={newSub}
                      onChange={(e) => setNewSub(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSub() } }}
                      placeholder="Agregar paso... (Enter)"
                      className="input input-bordered input-xs flex-1 rounded-xl text-xs"
                    />
                    <button type="button" onClick={addSub} disabled={!newSub.trim()} className="btn btn-xs btn-primary rounded-xl px-3">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Toggle más opciones */}
                <button
                  type="button"
                  onClick={() => setShowMore(!showMore)}
                  className="flex items-center gap-2 text-xs text-base-content/50 hover:text-base-content transition-colors w-fit -mt-2"
                >
                  {showMore ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {showMore ? 'Ocultar opciones adicionales' : 'Opciones adicionales'}
                  <span className="text-[10px] text-base-content/40">(Recursos, Participantes, Materiales, Etiquetas)</span>
                </button>

                {/* Sección avanzada */}
                {showMore && (
                  <div className="flex flex-col gap-4 pt-1">
                    {/* Links / Recursos */}
                    {showResources && (
                      <div>
                        <p className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest mb-2 flex items-center gap-1">
                          <Link2 className="w-3 h-3" /> Recursos y Enlaces
                        </p>
                        {links.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {links.map((l) => (
                              <div key={l.id} className="flex items-center gap-1.5 bg-base-200 px-2.5 py-1.5 rounded-xl text-xs border border-base-300">
                                {getLinkIcon(l.type)}
                                <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium max-w-[120px] truncate">{l.title}</a>
                                <ExternalLink className="w-2.5 h-2.5 text-base-content/30" />
                                <button type="button" onClick={() => setLinks((p) => p.filter((x) => x.id !== l.id))} className="text-base-content/30 hover:text-rose-500 ml-1"><X className="w-3 h-3" /></button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input type="text" value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} placeholder="URL del recurso..." className="input input-bordered input-xs flex-1 rounded-xl text-xs" />
                          <input type="text" value={newLinkTitle} onChange={(e) => setNewLinkTitle(e.target.value)} placeholder="Título (opcional)" className="input input-bordered input-xs w-28 rounded-xl text-xs" />
                          <button type="button" onClick={addLink} className="btn btn-xs btn-outline rounded-xl">Agregar</button>
                        </div>
                      </div>
                    )}

                    {/* Participantes + Materiales */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {showParticipants && (
                        <div>
                          <p className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <Users className="w-3 h-3" /> Participantes
                          </p>
                          <div className="flex gap-1.5 mb-1.5">
                            <input type="text" value={newParticipant} onChange={(e) => setNewParticipant(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const v = newParticipant.trim(); if (v && !participants.includes(v)) { setParticipants((p) => [...p, v]); setNewParticipant('') } } }} placeholder="Nombre o correo..." className="input input-bordered input-xs flex-1 rounded-xl text-xs" />
                            <button type="button" onClick={() => { const v = newParticipant.trim(); if (v && !participants.includes(v)) { setParticipants((p) => [...p, v]); setNewParticipant('') } }} className="btn btn-xs btn-primary rounded-xl px-2"><Plus className="w-3 h-3" /></button>
                          </div>
                          <div className="flex flex-wrap gap-1">{participants.map((p, i) => <span key={i} className="badge badge-xs bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400 gap-1 text-[10px]">{p}<button type="button" onClick={() => setParticipants((pr) => pr.filter((_, j) => j !== i))} className="hover:text-rose-500 font-bold">×</button></span>)}</div>
                        </div>
                      )}

                      {showMaterials && (
                        <div>
                          <p className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <Package className="w-3 h-3" /> Materiales
                          </p>
                          <div className="flex gap-1.5 mb-1.5">
                            <input type="text" value={newMaterial} onChange={(e) => setNewMaterial(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const v = newMaterial.trim(); if (v && !materials.includes(v)) { setMaterials((m) => [...m, v]); setNewMaterial('') } } }} placeholder="Material o recurso..." className="input input-bordered input-xs flex-1 rounded-xl text-xs" />
                            <button type="button" onClick={() => { const v = newMaterial.trim(); if (v && !materials.includes(v)) { setMaterials((m) => [...m, v]); setNewMaterial('') } }} className="btn btn-xs btn-warning rounded-xl px-2"><Plus className="w-3 h-3" /></button>
                          </div>
                          <div className="flex flex-wrap gap-1">{materials.map((m, i) => <span key={i} className="badge badge-xs bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 gap-1 text-[10px]">{m}<button type="button" onClick={() => setMaterials((mt) => mt.filter((_, j) => j !== i))} className="hover:text-rose-500 font-bold">×</button></span>)}</div>
                        </div>
                      )}
                    </div>

                    {/* Etiquetas */}
                    <div>
                      <p className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest mb-2 flex items-center gap-1"><Tag className="w-3 h-3" /> Etiquetas</p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {tags.map((t, i) => (
                          <span key={i} className="badge badge-sm bg-primary/10 text-primary border-primary/20 gap-1 font-semibold">
                            {t}
                            <button type="button" onClick={() => setTags((prev) => prev.filter((_, j) => j !== i))} className="hover:text-rose-500 font-bold">×</button>
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) } }}
                        placeholder="Etiqueta... (Enter o coma para agregar)"
                        className="input input-bordered input-xs w-full rounded-xl text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Panel lateral (Prioridad y Metadatos) */}
              <div className="w-full md:w-64 lg:w-72 flex-shrink-0 bg-base-200/50 md:border-l border-t md:border-t-0 border-base-200 flex flex-col gap-4 p-4 sm:p-5 md:overflow-y-auto">

                {/* Prioridad visual */}
                <div>
                  <p className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest mb-2.5">Prioridad</p>
                  <Controller
                    name="priority"
                    control={control}
                    render={({ field }) => (
                      <div className="flex flex-col gap-1.5">
                        {PRIORITY_CONFIG.map((p) => {
                          const Icon = p.icon
                          const active = field.value === p.value
                          return (
                            <button
                              key={p.value}
                              type="button"
                              onClick={() => field.onChange(p.value)}
                              className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                                active
                                  ? `${p.activeBg} ${p.color} shadow-2xs`
                                  : 'border-base-200 bg-base-100 text-base-content/60 hover:bg-base-200/50'
                              }`}
                            >
                              <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? p.color : 'text-base-content/30'}`} />
                              <span className="text-[11px] font-semibold leading-tight">{p.label}</span>
                              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  />
                </div>

                {/* Alcance */}
                <div>
                  <p className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest mb-1.5">Alcance</p>
                  <Controller
                    name="scope_period"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="select select-bordered select-xs w-full rounded-xl text-xs">
                        {SCOPE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    )}
                  />
                </div>

                {/* Categoría */}
                <div>
                  <p className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest mb-1.5">Categoría</p>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <select
                          value={CATEGORY_OPTIONS.includes(field.value) ? field.value : '__custom__'}
                          onChange={(e) => {
                            if (e.target.value !== '__custom__') field.onChange(e.target.value)
                          }}
                          className="select select-bordered select-xs w-full rounded-xl text-xs mb-1.5"
                        >
                          <option value="">Sin categoría</option>
                          {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                          {!CATEGORY_OPTIONS.includes(field.value) && field.value && (
                            <option value="__custom__">{field.value}</option>
                          )}
                        </select>
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="O escribe una..."
                          className="input input-bordered input-xs w-full rounded-xl text-xs"
                        />
                      </div>
                    )}
                  />
                </div>

                {/* Modalidad */}
                <div>
                  <p className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Modalidad
                  </p>
                  <Controller
                    name="location"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="Presencial / Virtual..."
                        className="input input-bordered input-xs w-full rounded-xl text-xs"
                      />
                    )}
                  />
                </div>

                {/* Guardar plantilla */}
                {!isEditing && showTemplates && (
                  <button
                    type="button"
                    onClick={() => {
                      const v = getValues()
                      if (!v.title?.trim()) { toast.error('Ingresa un título primero'); return }
                      saveCustomTemplate({
                        title: v.title, description: v.description || '',
                        category: v.category || 'general', priority: v.priority,
                        scope_period: v.scope_period, tags, materials, participants,
                        subtasks: subtasks.map((s) => ({ ...s, completed: false })),
                      })
                      toast.success('¡Plantilla guardada! 💾')
                    }}
                    className="flex items-center gap-1.5 text-[11px] text-base-content/50 hover:text-primary transition-colors mt-auto pt-2"
                  >
                    <Bookmark className="w-3 h-3" /> Guardar como plantilla
                  </button>
                )}
              </div>
            </div>

            {/* Static Clean Footer (Never absolute, never overlaps) */}
            <div className="flex items-center justify-between px-6 py-3.5 bg-base-100 border-t border-base-200 shrink-0">
              <span className="text-[11px] text-base-content/40 hidden sm:inline font-medium">
                {isEditing ? 'Modificando tarea existente' : 'Crea o programa una nueva tarea'}
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button type="button" onClick={onHide} className="btn btn-ghost btn-sm rounded-xl">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-sm rounded-xl min-w-32 gap-1.5 shadow-sm"
                >
                  {isSubmitting
                    ? <span className="loading loading-spinner loading-xs" />
                    : isEditing ? 'Guardar cambios' : '✓ Crear tarea'
                  }
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <TaskTemplatesModal
        visible={templatesVisible}
        onHide={() => setTemplatesVisible(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </>
  )
}
