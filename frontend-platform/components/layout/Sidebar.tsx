'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const menuItems = [
  { icon: '📊', label: 'Дашборд', href: '/dashboard' },
  { icon: '🏨', label: 'Активные отели', href: '/dashboard/hotels' },
  { icon: '📈', label: 'Статистика', href: '/dashboard/stats' },
  { icon: '💰', label: 'Биллинг', href: '/dashboard/billing' },
  { icon: '⚙️', label: 'Настройки', href: '/settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  const isActive = (href: string) => pathname === href

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-neutral-200">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
          <div className="w-8 h-8 bg-neutral-900 rounded-sm flex items-center justify-center text-white text-sm">
            A
          </div>
          Asystem
        </Link>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.href + item.label}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.href)
                ? 'bg-neutral-100 text-neutral-900'
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-neutral-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-neutral-600"
          onClick={handleLogout}
        >
          <span className="mr-3">🚪</span>
          Выход
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-white border border-neutral-200 rounded-lg p-2 shadow-sm"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <span className="text-xl">{mobileOpen ? '✕' : '☰'}</span>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-40 w-64 bg-white border-r border-neutral-200 h-screen flex flex-col transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-neutral-200 h-screen sticky top-0 flex-col">
        {sidebarContent}
      </aside>
    </>
  )
}
