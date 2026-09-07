import { Sun, Moon, Monitor, Check } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useUpdatePreferences } from '@/hooks/usePreferences'

type ThemeOption = 'light' | 'dark' | 'system'

interface ThemeCardData {
  value: ThemeOption
  label: string
  desc: string
  icon: React.ElementType
}

const THEME_OPTIONS: ThemeCardData[] = [
  {
    value: 'light',
    label: 'Modo Claro',
    desc: 'Fondo luminoso, óptimo para entornos con luz natural.',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Modo Oscuro',
    desc: 'Menor fatiga visual para jornadas extensas o nocturnas.',
    icon: Moon,
  },
  {
    value: 'system',
    label: 'Tema del Sistema',
    desc: 'Se adapta automáticamente a la configuración de tu sistema operativo.',
    icon: Monitor,
  },
]

export function ThemeSettings() {
  const { theme, setTheme } = useTheme()
  const updatePrefs = useUpdatePreferences()

  const handleSelectTheme = (selected: ThemeOption) => {
    setTheme(selected)
    updatePrefs.mutate({ theme: selected })
  }

  return (
    <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl p-5 flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-bold text-base-content tracking-tight">
          Apariencia Visual
        </h3>
        <p className="text-xs text-base-content/60 mt-0.5">
          Personaliza la interfaz para trabajar cómodamente de día o de noche.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {THEME_OPTIONS.map(({ value, label, desc, icon: Icon }) => {
          const isSelected = theme === value

          return (
            <div
              key={value}
              onClick={() => handleSelectTheme(value)}
              className={[
                'p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 relative',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-xs ring-2 ring-primary/20'
                  : 'border-base-200 hover:border-base-300 bg-base-100/60',
              ].join(' ')}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary text-primary-content flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}

              <div className="flex items-center gap-2.5">
                <div
                  className={[
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-content'
                      : 'bg-base-200 text-base-content/70',
                  ].join(' ')}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="font-semibold text-xs text-base-content">
                  {label}
                </h4>
              </div>

              <p className="text-[11px] text-base-content/60 leading-relaxed">
                {desc}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
