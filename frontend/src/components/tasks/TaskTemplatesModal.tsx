import { useState } from 'react'
import { Dialog } from 'primereact/dialog'
import {
  Sparkles,
  X,
  CheckCircle2,
  Bookmark,
  Trash2,
  Layers,
  ArrowRight,
} from 'lucide-react'
import {
  getAllTemplates,
  deleteCustomTemplate,
  type AcademicTaskTemplate,
} from '@/utils/taskTemplates'
import toast from 'react-hot-toast'

interface TaskTemplatesModalProps {
  visible: boolean
  onHide: () => void
  onSelectTemplate: (template: AcademicTaskTemplate) => void
}

export function TaskTemplatesModal({ visible, onHide, onSelectTemplate }: TaskTemplatesModalProps) {
  const [activeTab, setActiveTab] = useState<'oficiales' | 'personalizadas'>('oficiales')
  const [, setRefreshKey] = useState(0)

  const allTemplates = getAllTemplates()
  const officialTemplates = allTemplates.filter((t) => !t.isCustom)
  const customTemplates = allTemplates.filter((t) => t.isCustom)

  const currentList = activeTab === 'oficiales' ? officialTemplates : customTemplates

  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteCustomTemplate(id)
    setRefreshKey((k) => k + 1)
    toast.success('Plantilla eliminada')
  }

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={null}
      closable={false}
      className="w-full max-w-3xl mx-4 rounded-3xl overflow-hidden shadow-2xl border border-base-200"
      contentClassName="p-0 bg-base-100"
      maskClassName="backdrop-blur-sm bg-base-900/50"
    >
      {/* ── Encabezado ────────────────────────────────────────────── */}
      <div className="p-5 border-b border-base-200 bg-gradient-to-r from-primary/10 via-base-100 to-secondary/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary text-primary-content flex items-center justify-center shadow-md shadow-primary/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-base-content flex items-center gap-2">
              Plantillas de Tareas Académicas
            </h2>
            <p className="text-xs text-base-content/60">
              Selecciona una rutina predefinida para autocompletar tu planificación en 1 clic.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onHide}
          className="btn btn-ghost btn-circle btn-sm"
          title="Cerrar modal"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Pestañas: Oficiales vs Personalizadas ──────────────────── */}
      <div className="flex border-b border-base-200 px-5 pt-3 bg-base-200/40 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('oficiales')}
          className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'oficiales'
              ? 'border-primary text-primary'
              : 'border-transparent text-base-content/60 hover:text-base-content'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Plantillas Oficiales ({officialTemplates.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('personalizadas')}
          className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'personalizadas'
              ? 'border-primary text-primary'
              : 'border-transparent text-base-content/60 hover:text-base-content'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Mis Plantillas ({customTemplates.length})</span>
        </button>
      </div>

      {/* ── Lista de Plantillas ───────────────────────────────────── */}
      <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
        {currentList.length === 0 ? (
          <div className="py-12 text-center text-base-content/50 space-y-2">
            <Bookmark className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-xs font-medium">Aún no tienes plantillas personalizadas guardadas.</p>
            <p className="text-[11px]">
              Al crear una tarea, pulsa "Guardar como plantilla" para reutilizarla cuando quieras.
            </p>
          </div>
        ) : (
          currentList.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => {
                onSelectTemplate(tpl)
                onHide()
              }}
              className="p-4 rounded-2xl bg-base-100 hover:bg-base-200/50 border border-base-200 hover:border-primary/40 transition-all cursor-pointer group shadow-2xs hover:shadow-md flex flex-col gap-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-base-content group-hover:text-primary transition-colors">
                      {tpl.title}
                    </h3>
                    <span className="badge badge-xs badge-ghost capitalize text-[10px]">
                      {tpl.category}
                    </span>
                    <span
                      className={`badge badge-xs text-[10px] font-medium ${
                        tpl.priority === 'urgente_importante'
                          ? 'badge-error'
                          : tpl.priority === 'importante_no_urgente'
                          ? 'badge-info'
                          : tpl.priority === 'urgente_no_importante'
                          ? 'badge-warning'
                          : 'badge-neutral'
                      }`}
                    >
                      {tpl.priority.replace(/_/g, ' ')}
                    </span>
                    <span className="badge badge-xs badge-outline capitalize text-[10px]">
                      {tpl.scope_period}
                    </span>
                  </div>
                  <p className="text-xs text-base-content/60 mt-1 line-clamp-2">
                    {tpl.description}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {tpl.isCustom && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCustom(tpl.id, e)}
                      className="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10"
                      title="Eliminar plantilla"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary btn-xs rounded-lg gap-1 font-semibold group-hover:shadow-xs"
                  >
                    <span>Usar</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Subtareas precargadas */}
              {tpl.subtasks && tpl.subtasks.length > 0 && (
                <div className="pt-2 border-t border-base-200/70">
                  <div className="text-[11px] font-semibold text-base-content/50 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Checklist preconfigurado ({tpl.subtasks.length} pasos):</span>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-base-content/75">
                    {tpl.subtasks.slice(0, 4).map((s, idx) => (
                      <li key={s.id || idx} className="flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                        <span className="truncate">{s.text}</span>
                      </li>
                    ))}
                    {tpl.subtasks.length > 4 && (
                      <li className="text-[10px] text-base-content/40 italic flex items-center gap-1">
                        +{tpl.subtasks.length - 4} pasos adicionales...
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Pie del Modal ─────────────────────────────────────────── */}
      <div className="p-3 bg-base-200/50 border-t border-base-200 flex items-center justify-between text-[11px] text-base-content/60 px-5">
        <span>Consejo: Al seleccionar una plantilla, podrás personalizar las fechas y detalles a tu gusto.</span>
        <button
          type="button"
          onClick={onHide}
          className="btn btn-ghost btn-xs rounded-lg"
        >
          Cerrar
        </button>
      </div>
    </Dialog>
  )
}
