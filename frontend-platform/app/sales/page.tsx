'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, ArrowRight, ClipboardList, Building2 } from 'lucide-react'
import { getLeads, getSalesStats } from '@/lib/salesApi'
import { useCurrentUser } from '@/lib/useCurrentUser'
import type { Lead, SalesStats } from '@/lib/types'

const STATUS_LABELS: Record<string, string> = { pending: 'Ожидает', configuring: 'Настройка', active: 'Активен', rejected: 'Отклонён' }
const STATUS_VARIANTS: Record<string, 'warning' | 'info' | 'success' | 'error' | 'default'> = { pending: 'warning', configuring: 'info', active: 'success', rejected: 'error' }

export default function SalesHomePage() {
  const { user, loading: userLoading } = useCurrentUser()
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<SalesStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userLoading) return
    const load = async () => {
      try {
        const [leadsData, statsData] = await Promise.all([
          getLeads({ limit: 5 }),
          getSalesStats(),
        ])
        setLeads(leadsData)
        setStats(statsData)
      } catch (err) { console.error(err) }
      setLoading(false)
    }
    load()
  }, [userLoading])

  const firstName = user?.name?.split(' ')[0] || ''

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8 space-y-6">
      {/* Greeting */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-semibold tracking-tight text-[#FAFAFA] mb-1">
          {firstName ? `Привет, ${firstName}` : 'Sales'}
        </h1>
        <p className="text-[#737373] text-sm">Покажите клиенту живое демо за 30 секунд</p>
      </div>

      {/* Hero CTA */}
      <Link href="/create-bot" className="block group animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <Card className="p-8 relative overflow-hidden hover-lift cursor-pointer border-[#3B82F6]/40 hover:border-[#3B82F6]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/20 via-transparent to-transparent pointer-events-none" />
          <div className="relative flex items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-[#3B82F6] text-xs uppercase tracking-widest font-semibold mb-2">
                <Sparkles size={14} strokeWidth={2} />
                Новая демонстрация
              </div>
              <h2 className="text-2xl font-semibold text-[#FAFAFA] tracking-tight mb-1">Создать бота клиенту</h2>
              <p className="text-sm text-[#A3A3A3]">Можно заполнить демо-данными Ton Azure одной кнопкой — покажете бота меньше чем за минуту.</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#3B82F6] text-white flex items-center justify-center flex-shrink-0 group-hover:translate-x-1 transition-transform">
              <ArrowRight size={20} />
            </div>
          </div>
        </Card>
      </Link>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <StatPill label="Всего лидов" value={stats.total} />
          <StatPill label="Ожидают" value={stats.pending} tone="amber" />
          <StatPill label="Активных" value={stats.active} tone="emerald" />
          <StatPill label="Отклонённых" value={stats.rejected} tone="muted" />
        </div>
      )}

      {/* Recent leads */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold tracking-tight text-[#FAFAFA]">Последние лиды</h2>
          <Link href="/sales/leads" className="text-sm text-[#3B82F6] hover:underline flex items-center gap-1">Все <ArrowRight size={14} /></Link>
        </div>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
        ) : leads.length === 0 ? (
          <Card className="text-center py-12">
            <ClipboardList size={32} className="mx-auto text-[#262626] mb-3" strokeWidth={1} />
            <p className="text-[#737373] text-sm">Пока нет лидов — создай первого через «Создать бота клиенту»</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {leads.map(lead => (
              <Link key={lead.id} href={`/sales/leads/${lead.id}`} className="group block">
                <Card className="p-4 hover-lift cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-md bg-[#1A1A1A] border border-[#262626] flex items-center justify-center text-[#737373] group-hover:text-[#3B82F6] transition-colors flex-shrink-0">
                        <Building2 size={14} strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-[#FAFAFA] truncate">{lead.hotel_name}</div>
                        <div className="text-xs text-[#737373] truncate">
                          {lead.contact_name || '—'} · {lead.contact_phone || 'нет телефона'} · {new Date(lead.created_at).toLocaleDateString('ru')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge variant={STATUS_VARIANTS[lead.status] || 'default'}>{STATUS_LABELS[lead.status] || lead.status}</Badge>
                      <ArrowRight size={14} className="text-[#262626] group-hover:text-[#3B82F6] transition-colors" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatPill({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'amber' | 'emerald' | 'muted' }) {
  const color = tone === 'amber' ? 'text-amber-400' : tone === 'emerald' ? 'text-emerald-400' : tone === 'muted' ? 'text-[#737373]' : 'text-[#3B82F6]'
  return (
    <Card className="p-4">
      <div className={`text-2xl font-semibold tracking-tight ${color}`}>{value}</div>
      <div className="text-xs text-[#737373] mt-1">{label}</div>
    </Card>
  )
}
