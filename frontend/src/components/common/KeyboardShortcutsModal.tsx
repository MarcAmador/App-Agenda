import { Dialog } from 'primereact/dialog'
import { Keyboard, X } from 'lucide-react'

interface KeyboardShortcutsModalProps {
  visible: boolean
  onHide: () => void
}

interface ShortcutItem {
  keys: string[]
  label: string
  description: string
}

const SHORTCUTS: { category: string; items: ShortcutItem[] }[] = [
  {
    category: 'Productividad & Navegación',
    items: [
      {
        keys: ['N'],
        label: 'Nueva Tarea',
        description: 'Abre el modal de registro rápido de actividades desde cualquier vista.',
      },
      {
        keys: ['T'],
        label: 'Modo Enfoque',
        description: 'Abre el recomendador inteligente "¿Qué hago ahora?".',
      },
      {
        keys: ['/'],
        label: 'Búsqueda Rápida',
        description: 'Salta a la tabla de tareas y enfoca la barra de búsqueda en tiempo real.',
      },
      {
        keys: ['?'],
        label: 'Atajos de Teclado',
        description: 'Muestra u oculta este panel de atajos.',
      },
    ],
  },
  {
    category: 'Cronómetro & Modo Enfoque',
    items: [
      {
        keys: ['Espacio'],
        label: 'Pausar / Reanudar',
        description: 'Alterna la cuenta regresiva del temporizador de enfoque activo.',
      },
      {
        keys: ['Esc'],
        label: 'Cerrar / Minimizar',
        description: 'Cierra los modales activos o minimiza ventanas emergentes.',
      },
    ],
  },
  {
    category: 'Audio & Comportamiento',
    items: [
      {
        keys: ['M'],
        label: 'Silenciar / Activar Audio',
        description: 'Alterna los efectos de sonido hápticos sintetizados de la aplicación.',
      },
    ],
  },
]

export function KeyboardShortcutsModal({ visible, onHide }: KeyboardShortcutsModalProps) {
  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={null}
      closable={false}
      className="w-full max-w-lg mx-4 rounded-3xl overflow-hidden shadow-2xl border border-base-200"
      contentClassName="p-0 bg-base-100"
      maskClassName="backdrop-blur-sm bg-base-900/40"
    >
      {/* ── Encabezado ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-primary/10 via-base-100 to-secondary/10 p-5 border-b border-base-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Keyboard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-base-content tracking-tight">
              Atajos de Teclado Globales
            </h3>
            <p className="text-[11px] text-base-content/60">
              Aumenta tu velocidad y productividad docente con estos atajos rápidos.
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

      {/* ── Contenido de Atajos ─────────────────────────────────────── */}
      <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
        {SHORTCUTS.map((section) => (
          <div key={section.category} className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">
              {section.category}
            </h4>

            <div className="space-y-1.5">
              {section.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-base-200/40 border border-base-200/80 gap-3"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold text-xs text-base-content block leading-tight">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-base-content/60 leading-snug">
                      {item.description}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {item.keys.map((k) => (
                      <kbd
                        key={k}
                        className="kbd kbd-sm bg-base-100 border-base-300 font-mono text-[11px] font-bold shadow-2xs px-2"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Pie ─────────────────────────────────────────────────────── */}
      <div className="p-3 bg-base-200/40 border-t border-base-200 flex items-center justify-between text-[11px] text-base-content/50 px-5">
        <span>Tip: Los atajos se pausan al escribir en campos de texto.</span>
        <button
          type="button"
          onClick={onHide}
          className="btn btn-primary btn-xs rounded-lg font-semibold"
        >
          Entendido
        </button>
      </div>
    </Dialog>
  )
}
