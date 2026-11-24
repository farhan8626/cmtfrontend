// ============================================================
//  src/components/layout/Sidebar.tsx
//  Desktop collapsible sidebar + mobile slide-in drawer
//  Branded for CMT Electrical Shop
// ============================================================
import { NavLink, useNavigate } from 'react-router-dom'
import {
  HomeIcon, CubeIcon, WrenchScrewdriverIcon,
  UsersIcon, DocumentTextIcon, Cog6ToothIcon,
  ArrowRightOnRectangleIcon, XMarkIcon, Bars3Icon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard',      to: '/',               icon: <HomeIcon className="h-5 w-5" /> },
  { label: 'Inventory',      to: '/inventory',      icon: <CubeIcon className="h-5 w-5" /> },
  { label: 'Repair Tickets', to: '/tickets',        icon: <WrenchScrewdriverIcon className="h-5 w-5" /> },
  { label: 'Billing',        to: '/billing',        icon: <DocumentTextIcon className="h-5 w-5" /> },
  { label: 'Invoices',       to: '/invoices',       icon: <ClipboardDocumentListIcon className="h-5 w-5" /> },
  { label: 'Customers',      to: '/customers',      icon: <UsersIcon className="h-5 w-5" /> },
  { label: 'Services',       to: '/services',       icon: <Cog6ToothIcon className="h-5 w-5" />, adminOnly: true },
  { label: 'Users',          to: '/users',          icon: <UsersIcon className="h-5 w-5" />, adminOnly: true },
]

function NavItems({ onClose }: { onClose?: () => void }) {
  const { isAdmin, user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-brand-700 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 font-bold text-white text-lg select-none">
          C
        </div>
        <div>
          <p className="font-bold text-white leading-tight">CMT</p>
          <p className="text-xs text-brand-200 leading-tight">Electrical Shop</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto text-brand-200 hover:text-white">
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems
          .filter(item => !item.adminOnly || isAdmin)
          .map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-brand-100 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
      </nav>

      {/* User + logout */}
      <div className="border-t border-brand-700 px-4 py-3">
        <p className="text-xs text-brand-200 truncate">{user?.fullName}</p>
        <p className="text-xs text-brand-300 truncate mb-2">{user?.role}</p>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-brand-100 hover:bg-white/10 hover:text-white transition-colors"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  )
}

// Desktop sidebar (always visible on lg+)
export function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:w-56 lg:flex-col lg:fixed lg:inset-y-0 bg-brand-800 shadow-lg z-30">
      <NavItems />
    </aside>
  )
}

// Mobile drawer + toggle button
export function MobileNav() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
        aria-label="Open menu"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative flex flex-col w-64 h-full bg-brand-800 shadow-xl">
            <NavItems onClose={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  )
}
