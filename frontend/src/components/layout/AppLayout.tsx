import { useState } from 'react'
import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface AppLayoutProps {
  children: ReactNode
  pageTitle: string
}

/**
 * Layout principal de la aplicación: Sidebar fijo (desktop) + Drawer (móvil) + Topbar + Contenido.
 */
export function AppLayout({ children, pageTitle }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-base-200 overflow-hidden">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Área principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMenuOpen={() => setSidebarOpen(true)} title={pageTitle} />

        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 lg:px-6 py-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
