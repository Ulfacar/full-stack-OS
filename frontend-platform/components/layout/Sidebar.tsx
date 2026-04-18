'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Building2, BarChart3, CreditCard,
  Users, Settings, LogOut, Menu, X, Sparkles, ClipboardList,
} from 'lucide-react'
import { useCurrentUser, clearCurrentUser } from '@/lib/useCurrentUser'

type MenuItem = { icon: any; label: string; href: string; highlight?: boolean }

const adminMenu: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Дашборд', href: '/dashboard' },
  { icon: Sparkles, label: 'Создать бота', href: '/create-bot', highlight: true },
  { icon: Building2, label: 'Отели', href: '/dashboard/hotels' },
  { icon: ClipboardList, label: 'Все лиды', href: '/sales/leads' },
  { icon: BarChart3, label: 'Статистика', href: '/dashboard/stats' },
  { icon: CreditCard, label: 'Биллинг', href: '/dashboard/billing' },
  { icon: Users, label: 'Пользователи', href: '/dashboard/users' },
  { icon: Settings, label: 'Настройки', href: '/settings' },
]

const salesMenu: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Главная', href: '/sales' },
  { icon: Sparkles, label: 'Создать бота', href: '/create-bot', highlight: true },
  { icon: ClipboardList, label: 'Мои лиды', href: '/sales/leads' },
  { icon: Settings, label: 'Настройки', href: '/settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isAdmin } = useCurrentUser()
  const menuItems = isAdmin ? adminMenu : salesMenu

  const handleLogout = () => {
    localStorage.removeItem('token')
    clearCurrentUser()
    router.push('/login')
  }

  const isActive = (href: string) => pathname === href

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-[#262626]">
        <Link href="/dashboard" className="flex items-center gap-2.5 text-base font-medium tracking-tighter text-[#FAFAFA]">
          <div className="w-8 h-8 bg-[#FAFAFA] rounded-lg flex items-center justify-center text-[#0A0A0A] text-xs font-semibold tracking-tighter">
            EM
          </div>
          <span>Ex<span className="text-[#3B82F6]">-Machina</span></span>
        </Link>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-3 space-y-0.5">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                active
                  ? 'bg-[#3B82F6] text-white'
                  : item.highlight
                    ? 'text-[#3B82F6] hover:bg-[#3B82F6]/10 border border-[#3B82F6]/30'
                    : 'text-[#A3A3A3] hover:bg-[#1A1A1A] hover:text-[#FAFAFA]'
              }`}
            >
              <Icon size={16} strokeWidth={1.5} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-[#262626]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-[#737373] hover:text-red-400 hover:bg-red-500/10 transition-colors duration-200 w-full"
        >
          <LogOut size={16} strokeWidth={1.5} />
          Выход
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-[#0A0A0A]/80 glass border border-[#262626] rounded-md p-2 text-[#FAFAFA]"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={16} /> : <Menu size={16} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 glass z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={`lg:hidden fixed top-0 left-0 z-40 w-[240px] bg-[#0A0A0A] border-r border-[#262626] h-screen flex flex-col transition-transform duration-300 ease-out ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[240px] bg-[#0A0A0A] border-r border-[#262626] h-screen sticky top-0 flex-col">
        {sidebarContent}
      </aside>
    </>
  )
}
