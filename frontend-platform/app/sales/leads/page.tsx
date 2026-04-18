'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Building2, ClipboardList, ArrowRight, Search } from 'lucide-react'
import { getLeads } from '@/lib/salesApi'
import type { Lead } from '@/lib/types'

const STATUS_LABELS: Record<string, string> = { pending: 'Ожидает', configuring: 'Настройка', active: 'Активен', rejected: 'Отклонён' }
const STATUS_VARIANTS: Record<string, 'warning' | 'info' | 'success' | 'error' | 'default'> = { pending: 'warning', configuring: 'info', active: 'success', rejected: 'error' }

const FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'pending', label: 'Ожидают' },
  { key: 'configuring', label: 'Настройка' },
  { key: 'active', label: 'Активные' },
  { key: 'rejected', label: 'Отклонённые' },
]

export default function SalesLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await getLeads(statusFilter === 'all' ? {} : { status: statusFilter })
        setLeads(data)
      } catch (err) { console.error(err) }
      setLoading(false)
    }
    load()
  }, [statusFilter])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return leads
    return leads.filter(l =>
      l.hotel_name.toLowerCase().includes(q) ||
      (l.contact_name || '').toLowerCase().includes(q) ||
      (l.contact_phone || '').toLowerCase().includes(q)
    )
  }, [leads, search])

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8 space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-semibold tracking-tight text-[#FAFAFA] mb-1">Мои лиды</h1>
        <p className="text-[#737373] text-sm">Заявки, которые ты оформил через визард</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
          <Input placeholder="Поиск по имени отеля, контакту, телефону" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === f.key
                  ? 'bg-[#3B82F6] text-white'
                  : 'bg-[#1A1A1A] text-[#A3A3A3] hover:text-[#FAFAFA] border border-[#262626]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <Card className="text-center py-12">
            <ClipboardList size={32} className="mx-auto text-[#262626] mb-3" strokeWidth={1} />
            <p className="text-[#737373] text-sm">{leads.length === 0 ? 'Пока нет лидов — создай первого через визард' : 'Ничего не нашлось по фильтру'}</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map(lead => (
              <Link key={lead.id} href={`/sales/leads/${lead.id}`} className="group block">
                <Card className="p-4 hover-lift cursor-pointer">
                  <div className="flex justify-between items-center gap-3">
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
