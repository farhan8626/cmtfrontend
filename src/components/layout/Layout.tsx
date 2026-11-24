// ============================================================
//  src/components/layout/Layout.tsx  –  App shell
// ============================================================
import { Outlet } from 'react-router-dom'
import { Sidebar, MobileNav } from './Sidebar'
import { useAuth } from '../../context/AuthContext'

export function Layout() {
  const { user } = useAuth()
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="lg:pl-56 flex flex-col min-h-screen">
        {/* Top navbar (mobile only shows hamburger; desktop shows page header) */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 shadow-sm">
          <MobileNav />
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-sm text-gray-500">{user?.fullName}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white select-none">
              {user?.fullName?.[0] ?? 'U'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
