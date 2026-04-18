'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Bot, Building2, ArrowRight } from 'lucide-react'
import api from '@/lib/api'
import { useCurrentUser } from '@/lib/useCurrentUser'

interface Application { id: number; status: string; hotel_name: string; contact_name: string | null; contact_phone: string | null; created_at: string }
interface Hotel { id: number; name: string; slug: string; is_active: boolean; has_telegram_bot: boolean; status: string; created_at: string }

const STATUS_LABELS: Record<string, string> = { pending: 'Ожидает', configuring: 'Настройка', active: 'Активен', rejected: 'Отклонён' }
const STATUS_VARIANTS: Record<string, 'warning' | 'info' | 'success' | 'error' | 'default'> = { pending: 'warning', configuring: 'info', active: 'success', rejected: 'error' }

export default function DashboardPage() {
  const router = useRouter()
  const { isAdmin, isSales, loading: userLoading } = useCurrentUser()
  const [applications, setApplications] = useState<Application[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userLoading && isSales) {
      router.replace('/sales')
    }
  }, [userLoading, isSales, router])

  useEffect(() => {
    const load = async () => {
      try {
        const requests: Promise<any>[] = [api.get('/hotels')]
        if (isAdmin) requests.unshift(api.get('/admin/applications'))
        const results = await Promise.all(requests)
        if (isAdmin) {
          setApplications(results[0].data)
          setHotels(results[1].data)
        } else {
          setHotels(results[0].data)
        }
      } catch (err) { console.error(err) }
      setLoading(false)
    }
    if (!userLoading && !isSales) load()
  }, [userLoading, isAdmin, isSales])

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8 space-y-6">
        <div className="skeleton h-8 w-40 rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      </div>
    )
  }

  const stats = [
    { label: 'Новых заявок', value: applications.filter(a => a.status === 'pending').length, icon: FileText, color: 'text-amber-400' },
    { label: 'Активных ботов', value: hotels.filter(h => h.is_active).length, icon: Bot, color: 'text-emerald-400' },
    { label: 'Всего отелей', value: hotels.length, icon: Building2, color: 'text-[#3B82F6]' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8 space-y-8">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-semibold tracking-tight text-[#FAFAFA] mb-1">Dashboard</h1>
        <p className="text-[#737373] text-sm">Управление ботами отелей</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.label}
              className="animate-fade-in-up hover-lift p-5"
              style={{ animationDelay: `${0.1 + i * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-md bg-[#1A1A1A] border border-[#262626] flex items-center justify-center ${stat.color}`}>
                  <Icon size={16} strokeWidth={1.5} />
                </div>
              </div>
              <div className="text-2xl font-semibold tracking-tight text-[#FAFAFA]">{stat.value}</div>
              <div className="text-xs text-[#737373] mt-1">{stat.label}</div>
            </Card>
          )
        })}
      </div>

      {/* Applications — admin only */}
      {isAdmin && (
      <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <h2 className="text-base font-semibold tracking-tight mb-3 text-[#FAFAFA]">Заявки</h2>
        {applications.length === 0 ? (
          <Card className="text-center py-12">
            <FileText size={32} className="mx-auto text-[#262626] mb-3" strokeWidth={1} />
            <p className="text-[#737373] text-sm">Пока нет заявок</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {applications.map(app => (
              <a key={app.id} href={`/dashboard/applications/${app.id}`} className="group block">
                <Card className="p-4 hover-lift cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-[#1A1A1A] border border-[#262626] flex items-center justify-center text-[#737373] group-hover:text-[#3B82F6] transition-colors">
                        <Building2 size={14} strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-[#FAFAFA]">{app.hotel_name}</div>
                        <div className="text-xs text-[#737373]">
                          {app.contact_name} · {app.contact_phone} · {new Date(app.created_at).toLocaleDateString('ru')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={STATUS_VARIANTS[app.status] || 'default'}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          app.status === 'active' ? 'bg-emerald-400' : app.status === 'pending' ? 'bg-amber-400' : 'bg-[#737373]'
                        }`} />
                        {STATUS_LABELS[app.status] || app.status}
                      </Badge>
                      <ArrowRight size={14} className="text-[#262626] group-hover:text-[#3B82F6] transition-colors" />
                    </div>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Hotels */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
        <h2 className="text-base font-semibold tracking-tight mb-3 text-[#FAFAFA]">Активные отели</h2>
        {hotels.length === 0 ? (
          <Card className="text-center py-12">
            <Building2 size={32} className="mx-auto text-[#262626] mb-3" strokeWidth={1} />
            <p className="text-[#737373] text-sm">Нет активных отелей</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {hotels.map(hotel => (
              <Card key={hotel.id} className="p-4 hover-lift flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-[#1A1A1A] border border-[#262626] flex items-center justify-center">
                    <Building2 size={14} strokeWidth={1.5} className="text-[#737373]" />
                  </div>
                  <div>
                    <div className="font-medium text-sm text-[#FAFAFA]">{hotel.name}</div>
                    <div className="text-xs text-[#737373]">/{hotel.slug} · {hotel.has_telegram_bot ? 'TG connected' : 'TG not set'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${hotel.is_active ? 'bg-emerald-400 animate-pulse-soft' : 'bg-[#737373]'}`} />
                  <span className="text-xs text-[#737373]">{hotel.is_active ? 'Online' : 'Offline'}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
