import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

// Todos los temas DaisyUI disponibles en la app principal
export const DAISY_THEMES = [
  { value: 'light',      label: 'Claro',       emoji: '☀️' },
  { value: 'dark',       label: 'Oscuro',      emoji: '🌙' },
  { value: 'corporate',  label: 'Corporativo', emoji: '🏢' },
  { value: 'emerald',    label: 'Esmeralda',   emoji: '💚' },
  { value: 'synthwave',  label: 'Synthwave',   emoji: '🎸' },
  { value: 'retro',      label: 'Retro',       emoji: '📺' },
  { value: 'cyberpunk',  label: 'Cyberpunk',   emoji: '⚡' },
  { value: 'dracula',    label: 'Drácula',     emoji: '🧛' },
  { value: 'aqua',       label: 'Aqua',        emoji: '🌊' },
  { value: 'forest',     label: 'Bosque',      emoji: '🌲' },
  { value: 'luxury',     label: 'Luxury',      emoji: '💎' },
  { value: 'business',   label: 'Business',    emoji: '💼' },
  { value: 'night',      label: 'Noche',       emoji: '🌃' },
  { value: 'coffee',     label: 'Café',        emoji: '☕' },
  { value: 'winter',     label: 'Invierno',    emoji: '❄️' },
  { value: 'dim',        label: 'Dim',         emoji: '🌫️' },
  { value: 'nord',       label: 'Nord',        emoji: '🧊' },
  { value: 'sunset',     label: 'Atardecer',   emoji: '🌅' },
  { value: 'halloween',  label: 'Halloween',   emoji: '🎃' },
  { value: 'pastel',     label: 'Pastel',      emoji: '🎨' },
  { value: 'fantasy',    label: 'Fantasía',    emoji: '🧙' },
  { value: 'autumn',     label: 'Otoño',       emoji: '🍂' },
  { value: 'valentine',  label: 'Valentine',   emoji: '💝' },
  { value: 'garden',     label: 'Jardín',      emoji: '🌸' },
] as const

export type DaisyTheme = typeof DAISY_THEMES[number]['value']

// Temas "oscuros" para aplicar la clase dark: de Tailwind
const DARK_THEMES: DaisyTheme[] = [
  'dark', 'synthwave', 'halloween', 'forest', 'aqua', 'dracula',
  'business', 'night', 'coffee', 'dim', 'luxury', 'cyberpunk',
]

const THEME_KEY = 'agenda-theme'

interface ThemeContextValue {
  theme: DaisyTheme
  setTheme: (theme: DaisyTheme) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function applyTheme(themeName: DaisyTheme) {
  document.documentElement.setAttribute('data-theme', themeName)
  const isDark = DARK_THEMES.includes(themeName)
  document.documentElement.classList.toggle('dark', isDark)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<DaisyTheme>(() => {
    const stored = localStorage.getItem(THEME_KEY)
    // Migrar temas legacy (system/light/dark simple)
    if (!stored || stored === 'system') return 'light'
    return stored as DaisyTheme
  })

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = (newTheme: DaisyTheme) => {
    localStorage.setItem(THEME_KEY, newTheme)
    setThemeState(newTheme)
    applyTheme(newTheme)
  }

  const isDark = DARK_THEMES.includes(theme)

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>')
  return ctx
}
