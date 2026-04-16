'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CardSkeleton } from '@/components/ui/skeleton'
import { Building2, Activity, MessageSquare, DollarSign, ArrowRight, AlertTriangle } from 'lucide-react'
import api from '@/lib/api'
import type { HotelWithStats } from '@/lib/types'

export default function ActiveHotelsPage() {
  const { data: hotels, isLoading } = useQuery({
    queryKey: ['admin-hotels'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/hotels/')
        return response.data as HotelWithStats[]
      } catch {
        const response = await api.get('/hotels')
        return (response.data || []).map((hotel: any) => ({
          ...hotel,
          status: hotel.status || 'demo',
          monthly_budget: hotel.monthly_budget || 5.0,
          budget_used: 0,
          budget_remaining: hotel.monthly_budget || 5.0,
          conversations_month: 0,
          active_conversations: 0,
          ai_cost_month: 0,
          last_activity: null,
          requests_handled: 0,
        })) as HotelWithStats[]
      }
    },
  })

  const totalAICost = hotels?.reduce((sum, h) => sum + h.ai_cost_month, 0) || 0
  const botsNearLimit = hotels?.filter(h => h.budget_remaining < 1).length || 0

  const summaryCards = [
    { label: 'Всего отелей', value: hotels?.length || 0, icon: Building2 },
    { label: 'Активных', value: hotels?.filter(h => h.status === 'active').length || 0, icon: Activity },
    { label: 'Демо', value: hotels?.filter(h => h.status === 'demo').length || 0, icon: MessageSquare },
    { label: 'AI расход / мес', value: `$${totalAICost.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-400' },
    { label: 'У лимита', value: botsNearLimit, icon: AlertTriangle, color: botsNearLimit > 0 ? 'text-red-400' : '' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8 animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-[#FAFAFA] mb-1">
          Активные отели
        </h1>
        <p className="text-[#737373] text-sm tracking-tight">
          Мониторинг ботов, бюджетов и AI расходов
        </p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 mb-6 lg:mb-8">
        {isLoading ? (
          <>
            <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
          </>
        ) : (
          summaryCards.map((card, i) => {
            const Icon = card.icon
            return (
              <Card key={card.label} className="p-4 hover-lift" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} className="text-[#737373]" strokeWidth={1.5} />
                  <span className="text-xs text-[#737373] tracking-tight">{card.label}</span>
                </div>
                <div className={`text-2xl font-semibold tracking-tight text-[#FAFAFA] ${card.color || ''}`}>
                  {card.value}
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-16 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Hotels table - desktop */}
      {!isLoading && hotels && hotels.length > 0 && (
        <>
          <Card className="hidden lg:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#262626] text-left">
                    <th className="pb-3 font-medium text-[#737373] text-xs uppercase tracking-wider">Отель</th>
                    <th className="pb-3 font-medium text-[#737373] text-xs uppercase tracking-wider">Статус</th>
                    <th className="pb-3 font-medium text-[#737373] text-xs uppercase tracking-wider">Бюджет</th>
                    <th className="pb-3 font-medium text-[#737373] text-xs uppercase tracking-wider">Диалоги</th>
                    <th className="pb-3 font-medium text-[#737373] text-xs uppercase tracking-wider">AI расход</th>
                    <th className="pb-3 font-medium text-[#737373] text-xs uppercase tracking-wider">Активность</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F1F]">
                  {hotels.map((hotel) => {
                    const budgetPercent = hotel.monthly_budget > 0
                      ? Math.min(100, (hotel.budget_used / hotel.monthly_budget) * 100)
                      : 0
                    const budgetColor = budgetPercent > 90 ? 'bg-red-500' : budgetPercent > 70 ? 'bg-yellow-500' : 'bg-emerald-500'

                    return (
                      <tr key={hotel.id} className="hover:bg-[#1A1A1A]/50 transition-colors">
                        <td className="py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] border border-[#262626] flex items-center justify-center">
                              <Building2 size={14} className="text-[#737373]" strokeWidth={1.5} />
                            </div>
                            <span className="font-medium tracking-tight text-[#FAFAFA]">{hotel.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <HotelStatusBadge status={hotel.status} />
                        </td>
                        <td className="py-3.5">
                          <div className="w-24">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-[#FAFAFA]">${hotel.budget_used.toFixed(2)}</span>
                              <span className="text-[#737373]">${hotel.monthly_budget}</span>
                            </div>
                            <div className="h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                              <div className={`h-full ${budgetColor} rounded-full`} style={{ width: `${budgetPercent}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 tracking-tight text-[#FAFAFA]">
                          <span className="font-medium">{hotel.conversations_month}</span>
                          <span className="text-[#737373]"> / {hotel.active_conversations}</span>
                        </td>
                        <td className="py-3.5 font-mono text-xs tracking-tight text-[#FAFAFA]">
                          ${hotel.ai_cost_month.toFixed(2)}
                        </td>
                        <td className="py-3.5 text-[#737373] text-xs">
                          {hotel.last_activity || 'Нет данных'}
                        </td>
                        <td className="py-3.5 space-x-2">
                          <Link
                            href={`/dashboard/hotels/${hotel.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#737373] hover:text-[#3B82F6] transition-colors"
                          >
                            Управление
                          </Link>
                          <Link
                            href={`/hotels/${hotel.id}/demo`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
                          >
                            Демо
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {hotels.map((hotel) => {
              const budgetPercent = hotel.monthly_budget > 0
                ? Math.min(100, (hotel.budget_used / hotel.monthly_budget) * 100)
                : 0
              const budgetColor = budgetPercent > 90 ? 'bg-red-500' : budgetPercent > 70 ? 'bg-yellow-500' : 'bg-emerald-500'

              return (
                <Link key={hotel.id} href={`/dashboard/hotels/${hotel.id}`}>
                  <Card className="p-4 hover-lift">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] border border-[#262626] flex items-center justify-center">
                          <Building2 size={14} className="text-[#737373]" strokeWidth={1.5} />
                        </div>
                        <span className="font-medium text-sm text-[#FAFAFA]">{hotel.name}</span>
                      </div>
                      <HotelStatusBadge status={hotel.status} />
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#FAFAFA]">Бюджет: ${hotel.budget_used.toFixed(2)} / ${hotel.monthly_budget}</span>
                      </div>
                      <div className="h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                        <div className={`h-full ${budgetColor} rounded-full`} style={{ width: `${budgetPercent}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-[#737373] text-xs">
                        Диалоги: <span className="text-[#FAFAFA] font-medium">{hotel.conversations_month}</span>
                      </div>
                      <div className="text-[#737373] text-xs">
                        AI: <span className="font-mono text-[#FAFAFA]">${hotel.ai_cost_month.toFixed(2)}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </>
      )}

      {/* Empty state */}
      {!isLoading && (!hotels || hotels.length === 0) && (
        <Card className="text-center py-16">
          <Building2 size={40} className="mx-auto text-[#262626] mb-4" strokeWidth={1} />
          <p className="text-[#737373] text-sm">Нет подключённых отелей</p>
          <Link href="/hotels/new" className="text-[#3B82F6] hover:underline text-sm mt-2 inline-block">
            Создать первого бота
          </Link>
        </Card>
      )}
    </div>
  )
}

function HotelStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return <Badge variant="success">Активен</Badge>
    case 'demo':
      return <Badge variant="warning">Демо</Badge>
    case 'suspended':
      return <Badge variant="error">Приостановлен</Badge>
    default:
      return <Badge variant="default">{status}</Badge>
  }
}
