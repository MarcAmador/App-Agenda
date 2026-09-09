import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

// El toggle rápido solo alterna entre light y dark
export function ThemeToggle() {
  const { setTheme, isDark } = useTheme()

  const toggle = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="btn btn-ghost btn-sm btn-circle"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-warning" />
      ) : (
        <Moon className="w-4 h-4 text-base-content/70" />
      )}
    </button>
  )
}
