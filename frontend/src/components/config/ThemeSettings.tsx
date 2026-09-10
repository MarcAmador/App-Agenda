import { Check, Palette } from 'lucide-react'
import { useTheme, DAISY_THEMES, type DaisyTheme } from '@/context/ThemeContext'
import { useUpdatePreferences } from '@/hooks/usePreferences'

export function ThemeSettings() {
  const { theme, setTheme } = useTheme()
  const updatePrefs = useUpdatePreferences()

  const handleSelectTheme = (selected: DaisyTheme) => {
    setTheme(selected)
    updatePrefs.mutate({ theme: selected })
  }

  return (
    <div id="tour-theme-selection" className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Palette className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-base-content tracking-tight">
            Tema Visual de la Interfaz
          </h3>
          <p className="text-xs text-base-content/60 mt-0.5">
            Elige entre {DAISY_THEMES.length} temas DaisyUI — el cambio es instantáneo y se guarda automáticamente.
          </p>
        </div>
      </div>

      {/* Grid de temas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {DAISY_THEMES.map(({ value, label, emoji }) => {
          const isSelected = theme === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleSelectTheme(value)}
              data-theme={value}
              className={[
                'relative flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border-2 transition-all duration-150 text-center group',
                isSelected
                  ? 'border-primary ring-2 ring-primary/25 shadow-md shadow-primary/15 scale-[1.03]'
                  : 'border-base-300 hover:border-base-content/25 hover:scale-[1.02] hover:shadow-sm',
              ].join(' ')}
            >
              {/* Swatch de colores reales del tema */}
              <div className="flex gap-0.5">
                <span className="w-3 h-3 rounded-full bg-primary block" />
                <span className="w-3 h-3 rounded-full bg-secondary block" />
                <span className="w-3 h-3 rounded-full bg-accent block" />
              </div>

              <span className="text-base leading-none">{emoji}</span>
              <span className="text-[10px] font-semibold text-base-content leading-tight truncate w-full">
                {label}
              </span>

              {isSelected && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary text-primary-content flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tema activo */}
      <div className="flex items-center gap-2 text-xs text-base-content/60 border-t border-base-200 pt-3">
        <span className="font-medium text-base-content/80">Tema activo:</span>
        <span className="badge badge-primary badge-sm font-semibold capitalize">
          {DAISY_THEMES.find(t => t.value === theme)?.emoji}{' '}
          {DAISY_THEMES.find(t => t.value === theme)?.label}
        </span>
      </div>
    </div>
  )
}
