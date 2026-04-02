'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const menuItems = [
  { icon: '📊', label: 'Дашборд', href: '/dashboard' },
  { icon: '🤖', label: 'Мои боты', href: '/dashboard' },
  { icon: '📈', label: 'Аналитика', href: '/analytics' },
  { icon: '⚙️', label: 'Настройки', href: '/settings' },
  { icon: '👤', label: 'Профиль', href: '/profile' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 h-screen sticky top-0 flex flex-col">
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
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === item.href
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
    </aside>
  )
}
