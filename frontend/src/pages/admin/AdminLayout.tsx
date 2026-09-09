import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard,
  Users,
  Mail,
  FileText,
  Server,
  ShieldCheck,
  AlertTriangle,
  Settings,
  Globe,
  ArrowLeft,
  Palette,
  LogOut,
  Bell,
  Sparkles,
} from 'lucide-react'

const DAISY_THEMES = [
  'light',
  'dark',
  'corporate',
  'emerald',
  'synthwave',
  'retro',
  'cyberpunk',
  'valentine',
  'halloween',
  'garden',
  'forest',
  'aqua',
  'pastel',
  'fantasy',
  'luxury',
  'dracula',
  'autumn',
  'business',
  'night',
  'coffee',
  'winter',
  'dim',
  'nord',
  'sunset',
]

const NAV_ITEMS = [
  { path: '/admin', label: 'Panel General', icon: LayoutDashboard, exact: true },
  { path: '/admin/usuarios', label: 'Usuarios y Roles', icon: Users },
  { path: '/admin/plantillas', label: 'Plantillas de Correo', icon: FileText, badge: '9' },
  { path: '/admin/emails', label: 'Centro de Emails', icon: Mail },
  { path: '/admin/smtp', label: 'Servidor SMTP', icon: Server },
  { path: '/admin/auditoria', label: 'Audit Logs', icon: ShieldCheck },
  { path: '/admin/alertas', label: 'Sistema de Alertas', icon: AlertTriangle, badgeColor: 'badge-error' },
  { path: '/admin/configuracion', label: 'Configuración Global', icon: Settings },
  { path: '/admin/oauth', label: 'Google OAuth', icon: Globe },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [currentTheme, setCurrentTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 'light'
  })

  const handleThemeChange = (themeName: string) => {
    setCurrentTheme(themeName)
    document.documentElement.setAttribute('data-theme', themeName)
    localStorage.setItem('agenda-theme', themeName)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-base-100 flex flex-col font-sans">
      {/* ─── Top Navbar DaisyUI ────────────────────────────────────────────────── */}
      <header className="navbar bg-base-100 border-b border-base-300 sticky top-0 z-30 px-4 shadow-sm">
        {/* Lado Izquierdo: Toggle Mobile y Marca */}
        <div className="flex-1 flex items-center gap-3">
          <label htmlFor="admin-drawer" className="btn btn-square btn-ghost lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-5 h-5 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </label>

          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="AgendaPro" className="w-9 h-9 rounded-xl shadow-md shadow-primary/20 object-cover" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight">AgendaPro</span>
                <span className="badge badge-primary badge-sm font-semibold tracking-wide uppercase px-2 py-0.5">
                  SuperAdmin
                </span>
              </div>
              <p className="text-[11px] text-base-content/60 font-medium hidden sm:block">
                Centro de Mando & Control Maestro
              </p>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Estado, Selector de Tema, Volver y Avatar */}
        <div className="flex-none flex items-center gap-2 sm:gap-3">
          {/* Indicador de Salud */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-semibold border border-success/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            <span>Sistema 100% Operativo</span>
          </div>

          {/* Selector de Temas DaisyUI */}
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-sm gap-1 text-xs">
              <Palette className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline capitalize">{currentTheme}</span>
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content z-[1] menu p-2 shadow-2xl bg-base-200 rounded-box w-52 max-h-96 overflow-y-auto border border-base-300 text-xs"
            >
              <li className="menu-title text-[11px] uppercase tracking-wider font-bold">
                Temas DaisyUI ({DAISY_THEMES.length})
              </li>
              {DAISY_THEMES.map((theme) => (
                <li key={theme}>
                  <button
                    onClick={() => handleThemeChange(theme)}
                    className={`capitalize flex justify-between ${currentTheme === theme ? 'active font-bold' : ''}`}
                  >
                    <span>{theme}</span>
                    {currentTheme === theme && <Sparkles className="w-3.5 h-3.5 text-warning" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Botón Volver a la App */}
          <Link to="/" className="btn btn-outline btn-sm gap-1.5 text-xs font-medium">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Volver a la App</span>
          </Link>

          {/* Menú de Usuario SuperAdmin */}
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-8 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img
                  src={
                    user?.user_metadata?.avatar_url ||
                    user?.user_metadata?.picture ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.email || 'admin'}`
                  }
                  alt="Avatar Admin"
                />
              </div>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-2xl bg-base-200 rounded-box w-64 border border-base-300"
            >
              <li className="px-3 py-2 border-b border-base-300 mb-1">
                <span className="font-bold text-sm block truncate">{user?.email}</span>
                <span className="text-xs text-primary font-semibold">Rol: Super Administrador</span>
              </li>
              <li>
                <Link to="/config" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span>Mi Cuenta & Ajustes</span>
                </Link>
              </li>
              <li>
                <button onClick={handleSignOut} className="text-error flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </header>

      {/* ─── Contenedor con Drawer DaisyUI ──────────────────────────────────────── */}
      <div className="drawer lg:drawer-open flex-1">
        <input id="admin-drawer" type="checkbox" className="drawer-toggle" />

        {/* Contenido Principal */}
        <div className="drawer-content flex flex-col p-4 sm:p-6 lg:p-8 bg-base-200/50">
          <Outlet />
        </div>

        {/* Barra Lateral / Sidebar con Scroll Independiente */}
        <div className="drawer-side z-20 lg:sticky lg:top-[65px] lg:h-[calc(100vh-65px)]">
          <label htmlFor="admin-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
          <aside className="w-72 h-full max-h-screen lg:max-h-[calc(100vh-65px)] overflow-y-auto bg-base-100 border-r border-base-300 flex flex-col justify-between p-4">
            <div>
              <div className="px-3 py-2 text-xs font-bold text-base-content/50 uppercase tracking-wider">
                Módulos de Gestión
              </div>
              <ul className="menu menu-md gap-1 p-0">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon
                  const isActive = item.exact
                    ? location.pathname === item.path
                    : location.pathname.startsWith(item.path)

                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`flex items-center justify-between py-2.5 px-3.5 rounded-xl font-medium transition-all ${
                          isActive
                            ? 'active bg-primary text-primary-content shadow-md shadow-primary/25 font-semibold'
                            : 'hover:bg-base-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-primary-content' : 'text-primary'}`} />
                          <span className="text-sm">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`badge badge-sm font-bold ${
                              isActive ? 'bg-primary-content text-primary' : item.badgeColor || 'badge-primary'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Tarjeta Informativa al pie del Sidebar */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/5 to-base-200 border border-primary/15 text-xs text-base-content/80 mt-6">
              <div className="flex items-center gap-2 font-bold text-primary mb-1">
                <Bell className="w-3.5 h-3.5" />
                <span>Modo SuperAdmin Activo</span>
              </div>
              <p className="text-[11px] leading-relaxed text-base-content/70">
                Tienes control total sobre la base de datos, correos, plantillas y políticas de usuarios de AgendaPro.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
