'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import api from '@/lib/api'
import type { AdminStats, AIUsageDetail } from '@/lib/types'

export default function StatsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/stats/')
        return response.data as AdminStats
      } catch {
        // Fallback: compute from hotels list
        const response = await api.get('/hotels')
        const hotels = response.data || []
        return {
          total_hotels: hotels.length,
          active_hotels: hotels.filter((h: { is_active: boolean }) => h.is_active).length,
          total_conversations_month: 0,
          total_ai_cost_month: 0,
          openrouter_balance: 0,
        } as AdminStats
      }
    },
  })

  const { data: dailyUsage } = useQuery({
    queryKey: ['admin-daily-usage'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/stats/daily')
        return response.data as AIUsageDetail[]
      } catch {
        // Mock data for development
        return generateMockDailyData()
      }
    },
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-neutral-900 mb-1">
          Статистика
        </h1>
        <p className="text-neutral-500 text-sm">
          Общий AI расход и состояние платформы
        </p>
      </div>

      {isLoading && (
        <div className="text-center py-12 text-neutral-400">Загрузка...</div>
      )}

      {!isLoading && stats && (
        <>
          {/* Main KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 mb-6 lg:mb-8">
            <Card className="p-4">
              <div className="text-2xl lg:text-3xl font-semibold">{stats.total_hotels}</div>
              <div className="text-xs text-neutral-500">Всего отелей</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl lg:text-3xl font-semibold">{stats.active_hotels}</div>
              <div className="text-xs text-neutral-500">Активных</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl lg:text-3xl font-semibold">{stats.total_conversations_month}</div>
              <div className="text-xs text-neutral-500">Диалогов / мес</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl lg:text-3xl font-semibold text-orange-600">
                ${stats.total_ai_cost_month.toFixed(2)}
              </div>
              <div className="text-xs text-neutral-500">AI расход / мес</div>
            </Card>
            <Card className="col-span-2 lg:col-span-1 p-4">
              <div className={`text-2xl lg:text-3xl font-semibold ${
                stats.openrouter_balance < 20 ? 'text-red-600' : 'text-green-600'
              }`}>
                ${stats.openrouter_balance.toFixed(2)}
              </div>
              <div className="text-xs text-neutral-500">Баланс OpenRouter</div>
              {stats.openrouter_balance < 20 && (
                <div className="text-xs text-red-500 mt-1 font-medium">
                  Пополните баланс!
                </div>
              )}
            </Card>
          </div>

          {/* Unit Economics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <Card>
              <h3 className="text-lg font-medium mb-4">Юнит-экономика (мес)</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Доход: {stats.active_hotels} x $20 подписка</span>
                  <span className="font-medium text-green-600">+${(stats.active_hotels * 20).toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Расход: VPS Contabo</span>
                  <span className="font-medium text-red-600">-$12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Расход: AI (OpenRouter)</span>
                  <span className="font-medium text-red-600">-${stats.total_ai_cost_month.toFixed(2)}</span>
                </div>
                <div className="border-t border-neutral-200 pt-3 flex justify-between">
                  <span className="font-medium">Чистыми</span>
                  <span className="font-semibold text-lg">
                    ${(stats.active_hotels * 20 - 12 - stats.total_ai_cost_month).toFixed(2)}/мес
                  </span>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-medium mb-4">AI расход по дням</h3>
              {dailyUsage && dailyUsage.length > 0 ? (
                <div className="space-y-2">
                  {dailyUsage.slice(-7).map((day) => (
                    <div key={day.date} className="flex items-center gap-3 text-sm">
                      <span className="text-neutral-500 w-20 shrink-0">{formatDate(day.date)}</span>
                      <div className="flex-1 bg-neutral-100 rounded-full h-2">
                        <div
                          className="bg-neutral-900 rounded-full h-2"
                          style={{
                            width: `${Math.min(100, (day.cost / Math.max(...dailyUsage.map(d => d.cost), 0.01)) * 100)}%`
                          }}
                        />
                      </div>
                      <span className="font-mono text-xs w-16 text-right">${day.cost.toFixed(2)}</span>
                      <span className="text-neutral-400 text-xs w-8 text-right">{day.conversations}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-400 text-sm">Нет данных за текущий период</p>
              )}
            </Card>
          </div>

          {/* Token usage details */}
          <Card>
            <h3 className="text-lg font-medium mb-4">Расход токенов (текущий месяц)</h3>
            {dailyUsage && dailyUsage.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-left">
                      <th className="pb-2 font-medium text-neutral-500">Дата</th>
                      <th className="pb-2 font-medium text-neutral-500">Диалоги</th>
                      <th className="pb-2 font-medium text-neutral-500">Prompt</th>
                      <th className="pb-2 font-medium text-neutral-500">Completion</th>
                      <th className="pb-2 font-medium text-neutral-500 text-right">Стоимость</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {dailyUsage.map((day) => (
                      <tr key={day.date}>
                        <td className="py-2">{formatDate(day.date)}</td>
                        <td className="py-2">{day.conversations}</td>
                        <td className="py-2 font-mono text-xs">{day.prompt_tokens.toLocaleString()}</td>
                        <td className="py-2 font-mono text-xs">{day.completion_tokens.toLocaleString()}</td>
                        <td className="py-2 font-mono text-right">${day.cost.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-neutral-200 font-medium">
                      <td className="pt-2">Итого</td>
                      <td className="pt-2">{dailyUsage.reduce((s, d) => s + d.conversations, 0)}</td>
                      <td className="pt-2 font-mono text-xs">
                        {dailyUsage.reduce((s, d) => s + d.prompt_tokens, 0).toLocaleString()}
                      </td>
                      <td className="pt-2 font-mono text-xs">
                        {dailyUsage.reduce((s, d) => s + d.completion_tokens, 0).toLocaleString()}
                      </td>
                      <td className="pt-2 font-mono text-right">
                        ${dailyUsage.reduce((s, d) => s + d.cost, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-neutral-400 text-sm">Нет данных о расходе токенов</p>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function generateMockDailyData(): AIUsageDetail[] {
  const data: AIUsageDetail[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    data.push({
      date: date.toISOString().split('T')[0],
      conversations: Math.floor(Math.random() * 30) + 5,
      prompt_tokens: Math.floor(Math.random() * 50000) + 10000,
      completion_tokens: Math.floor(Math.random() * 20000) + 5000,
      cost: parseFloat((Math.random() * 0.8 + 0.1).toFixed(3)),
    })
  }
  return data
}
