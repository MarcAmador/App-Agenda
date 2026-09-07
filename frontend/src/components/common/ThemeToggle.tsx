import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

type Option = { value: 'light' | 'dark' | 'system'; icon: React.ElementType; label: string }

const OPTIONS: Option[] = [
  { value: 'light',  icon: Sun,     label: 'Claro' },
  { value: 'dark',   icon: Moon,    label: 'Oscuro' },
  { value: 'system', icon: Monitor, label: 'Sistema' },
]

interface ThemeToggleProps {
  /** Mostrar etiqueta de texto junto al ícono */
  showLabel?: boolean
}

export function ThemeToggle({ showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  return (
    <div
      className="flex items-center gap-1 bg-base-200 rounded-xl p-1"
      role="group"
      aria-label="Selector de tema"
    >
      {OPTIONS.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            title={label}
            aria-label={label}
            aria-pressed={isActive}
            className={[
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
              isActive
                ? 'bg-base-100 text-base-content shadow-sm'
                : 'text-base-content/50 hover:text-base-content',
            ].join(' ')}
          >
            <Icon className="w-3.5 h-3.5" />
            {showLabel && <span>{label}</span>}
          </button>
        )
      })}
    </div>
  )
}
