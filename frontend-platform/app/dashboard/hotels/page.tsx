'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'
import type { HotelWithStats } from '@/lib/types'

// Mock data until backend API is ready
const mockHotels: HotelWithStats[] = [
  {
    id: 1,
    name: 'Ton Azure',
    slug: 'ton-azure',
    ai_model: 'deepseek/deepseek-chat',
    communication_style: 'friendly',
    languages: ['ru', 'en'],
    is_active: true,
    created_at: '2026-03-01',
    updated_at: '2026-04-08',
    conversations_month: 89,
    active_conversations: 3,
    ai_cost_month: 0.82,
    last_activity: '5 мин назад',
    requests_handled: 89,
  },
]

export default function ActiveHotelsPage() {
  const { data: hotels, isLoading } = useQuery({
    queryKey: ['admin-hotels'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/hotels/')
        return response.data as HotelWithStats[]
      } catch {
        // Fallback to regular hotels endpoint with mock stats
        const response = await api.get('/hotels')
        return (response.data || []).map((hotel: HotelWithStats) => ({
          ...hotel,
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-neutral-900 mb-1">
          Активные отели
        </h1>
        <p className="text-neutral-500 text-sm">
          Мониторинг всех подключённых отелей и AI расхода
        </p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
        <Card className="p-4">
          <div className="text-2xl font-semibold">{hotels?.length || 0}</div>
          <div className="text-xs text-neutral-500">Всего отелей</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-semibold">
            {hotels?.filter(h => h.is_active).length || 0}
          </div>
          <div className="text-xs text-neutral-500">Активных</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-semibold">
            {hotels?.reduce((sum, h) => sum + h.conversations_month, 0) || 0}
          </div>
          <div className="text-xs text-neutral-500">Диалогов / мес</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-semibold text-green-600">
            ${totalAICost.toFixed(2)}
          </div>
          <div className="text-xs text-neutral-500">AI расход / мес</div>
        </Card>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12 text-neutral-400">Загрузка...</div>
      )}

      {/* Hotels table - desktop */}
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
                    <th className="pb-3 font-medium text-neutral-500">Диалоги мес / сег</th>
                    <th className="pb-3 font-medium text-neutral-500">AI расход мес ($)</th>
                    <th className="pb-3 font-medium text-neutral-500">Последняя активность</th>
                    <th className="pb-3 font-medium text-neutral-500"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {hotels.map((hotel) => (
                    <tr key={hotel.id} className="hover:bg-neutral-50">
                      <td className="py-3 font-medium">{hotel.name}</td>
                      <td className="py-3">
                        <StatusBadge isActive={hotel.is_active} lastActivity={hotel.last_activity} />
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
                      <td className="py-3">
                        <Link
                          href={`/hotels/${hotel.id}`}
                          className="text-neutral-900 hover:underline text-sm font-medium"
                        >
                          Подробнее
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {hotels.map((hotel) => (
              <Link key={hotel.id} href={`/hotels/${hotel.id}`}>
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">{hotel.name}</span>
                    <StatusBadge isActive={hotel.is_active} lastActivity={hotel.last_activity} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-neutral-500">Диалоги:</span>{' '}
                      {hotel.conversations_month} / {hotel.active_conversations}
                    </div>
                    <div>
                      <span className="text-neutral-500">AI:</span>{' '}
                      <span className="font-mono">${hotel.ai_cost_month.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-400 mt-2">
                    {hotel.last_activity || 'Нет активности'}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {!isLoading && (!hotels || hotels.length === 0) && (
        <Card className="text-center py-12">
          <div className="text-4xl mb-3">🏨</div>
          <p className="text-neutral-500">Нет подключённых отелей</p>
        </Card>
      )}
    </div>
  )
}

function StatusBadge({ isActive, lastActivity }: { isActive: boolean; lastActivity: string | null }) {
  if (!isActive) {
    return <Badge variant="default">Неактивен</Badge>
  }

  // Determine if recently active (simple heuristic)
  const isRecent = lastActivity && (lastActivity.includes('мин') || lastActivity.includes('сек'))
  const isStale = lastActivity && lastActivity.includes('час')

  if (isRecent) return <Badge variant="success">Онлайн</Badge>
  if (isStale) return <Badge variant="warning">Неактивен</Badge>
  return <Badge variant="success">Активен</Badge>
}
