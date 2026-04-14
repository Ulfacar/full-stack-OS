'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-neutral-900 mb-1">
          Активные отели
        </h1>
        <p className="text-neutral-500 text-sm">
          Мониторинг ботов, бюджетов и AI расходов
        </p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 mb-6 lg:mb-8">
        <Card className="p-4">
          <div className="text-2xl font-semibold">{hotels?.length || 0}</div>
          <div className="text-xs text-neutral-500">Всего отелей</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-semibold">
            {hotels?.filter(h => h.status === 'active').length || 0}
          </div>
          <div className="text-xs text-neutral-500">Активных</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-semibold">
            {hotels?.filter(h => h.status === 'demo').length || 0}
          </div>
          <div className="text-xs text-neutral-500">Демо</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-semibold text-green-600">
            ${totalAICost.toFixed(2)}
          </div>
          <div className="text-xs text-neutral-500">AI расход / мес</div>
        </Card>
        <Card className="p-4">
          <div className={`text-2xl font-semibold ${botsNearLimit > 0 ? 'text-red-600' : 'text-neutral-900'}`}>
            {botsNearLimit}
          </div>
          <div className="text-xs text-neutral-500">У лимита</div>
        </Card>
      </div>

      {isLoading && (
        <div className="text-center py-12 text-neutral-400">Загрузка...</div>
      )}

      {!isLoading && hotels && hotels.length > 0 && (
        <>
          {/* Desktop table */}
          <Card className="hidden lg:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left">
                    <th className="pb-3 font-medium text-neutral-500">Отель</th>
                    <th className="pb-3 font-medium text-neutral-500">Статус</th>
                    <th className="pb-3 font-medium text-neutral-500">Бюджет</th>
                    <th className="pb-3 font-medium text-neutral-500">Диалоги</th>
                    <th className="pb-3 font-medium text-neutral-500">AI расход</th>
                    <th className="pb-3 font-medium text-neutral-500">Активность</th>
                    <th className="pb-3 font-medium text-neutral-500"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {hotels.map((hotel) => {
                    const budgetPercent = hotel.monthly_budget > 0
                      ? Math.min(100, (hotel.budget_used / hotel.monthly_budget) * 100)
                      : 0
                    const budgetColor = budgetPercent > 90 ? 'bg-red-500' : budgetPercent > 70 ? 'bg-yellow-500' : 'bg-green-500'

                    return (
                      <tr key={hotel.id} className="hover:bg-neutral-50">
                        <td className="py-3 font-medium">{hotel.name}</td>
                        <td className="py-3">
                          <HotelStatusBadge status={hotel.status} />
                        </td>
                        <td className="py-3">
                          <div className="w-24">
                            <div className="flex justify-between text-xs mb-1">
                              <span>${hotel.budget_used.toFixed(2)}</span>
                              <span className="text-neutral-400">${hotel.monthly_budget}</span>
                            </div>
                            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                              <div className={`h-full ${budgetColor} rounded-full`} style={{ width: `${budgetPercent}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          {hotel.conversations_month} / {hotel.active_conversations}
                        </td>
                        <td className="py-3 font-mono">
                          ${hotel.ai_cost_month.toFixed(2)}
                        </td>
                        <td className="py-3 text-neutral-500">
                          {hotel.last_activity || 'Нет данных'}
                        </td>
                        <td className="py-3 space-x-2">
                          <Link
                            href={`/dashboard/hotels/${hotel.id}`}
                            className="text-neutral-900 hover:underline text-sm font-medium"
                          >
                            Управление
                          </Link>
                          <Link
                            href={`/hotels/${hotel.id}/demo`}
                            className="text-blue-600 hover:underline text-sm"
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
              const budgetColor = budgetPercent > 90 ? 'bg-red-500' : budgetPercent > 70 ? 'bg-yellow-500' : 'bg-green-500'

              return (
                <Link key={hotel.id} href={`/dashboard/hotels/${hotel.id}`}>
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">{hotel.name}</span>
                      <HotelStatusBadge status={hotel.status} />
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Бюджет: ${hotel.budget_used.toFixed(2)} / ${hotel.monthly_budget}</span>
                      </div>
                      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div className={`h-full ${budgetColor} rounded-full`} style={{ width: `${budgetPercent}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-neutral-500">Диалоги:</span>{' '}
                        {hotel.conversations_month}
                      </div>
                      <div>
                        <span className="text-neutral-500">AI:</span>{' '}
                        <span className="font-mono">${hotel.ai_cost_month.toFixed(2)}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </>
      )}

      {!isLoading && (!hotels || hotels.length === 0) && (
        <Card className="text-center py-12">
          <p className="text-neutral-500">Нет подключённых отелей</p>
          <Link href="/hotels/new" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
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
