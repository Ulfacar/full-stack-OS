'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { CardSkeleton } from '@/components/ui/skeleton'
import { Building2, Activity, MessageSquare, DollarSign, Wallet, TrendingUp, TrendingDown } from 'lucide-react'
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
        return generateMockDailyData()
      }
    },
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8 animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-[#FAFAFA] mb-1">
          Статистика
        </h1>
        <p className="text-[#A3A3A3] text-sm tracking-tight">
          Общий AI расход и состояние платформы
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 mb-8">
          {[1, 2, 3, 4, 5].map(i => <CardSkeleton key={i} />)}
        </div>
      )}

      {!isLoading && stats && (
        <>
          {/* Main KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 mb-6 lg:mb-8">
            {[
              { label: 'Всего отелей', value: stats.total_hotels, icon: Building2 },
              { label: 'Активных', value: stats.active_hotels, icon: Activity },
              { label: 'Диалогов / мес', value: stats.total_conversations_month, icon: MessageSquare },
              { label: 'AI расход / мес', value: `$${stats.total_ai_cost_month.toFixed(2)}`, icon: DollarSign, color: 'text-amber-600' },
              { label: 'Баланс OpenRouter', value: `$${stats.openrouter_balance.toFixed(2)}`, icon: Wallet, color: stats.openrouter_balance < 20 ? 'text-red-600' : 'text-emerald-600', warn: stats.openrouter_balance < 20 },
            ].map((kpi, i) => {
              const Icon = kpi.icon
              return (
                <Card key={kpi.label} className={`p-4 hover-lift hover:shadow-card-md ${i === 4 ? 'col-span-2 lg:col-span-1' : ''}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={14} className="text-[#737373]" strokeWidth={1.5} />
                    <span className="text-xs text-[#A3A3A3] tracking-tight">{kpi.label}</span>
                  </div>
                  <div className={`text-2xl lg:text-3xl font-semibold tracking-tight ${kpi.color || ''}`}>
                    {kpi.value}
                  </div>
                  {kpi.warn && (
                    <div className="text-xs text-red-500 mt-1 font-medium tracking-tight">
                      Пополните баланс!
                    </div>
                  )}
                </Card>
              )
            })}
          </div>

          {/* Unit Economics + Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <Card>
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp size={16} className="text-[#737373]" strokeWidth={1.5} />
                <h3 className="text-base font-semibold tracking-tight text-[#FAFAFA]">Юнит-экономика (мес)</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[#A3A3A3] tracking-tight">Доход: {stats.active_hotels} x $20 подписка</span>
                  <span className="font-medium text-emerald-600">+${(stats.active_hotels * 20).toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#A3A3A3] tracking-tight">Расход: VPS Contabo</span>
                  <span className="font-medium text-red-600">-$12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#A3A3A3] tracking-tight">Расход: AI (OpenRouter)</span>
                  <span className="font-medium text-red-600">-${stats.total_ai_cost_month.toFixed(2)}</span>
                </div>
                <div className="border-t border-[#262626] pt-3 flex justify-between items-center">
                  <span className="font-medium tracking-tight text-[#FAFAFA]">Чистыми</span>
                  <span className="font-semibold text-lg tracking-tight text-[#FAFAFA]">
                    ${(stats.active_hotels * 20 - 12 - stats.total_ai_cost_month).toFixed(2)}/мес
                  </span>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-5">
                <TrendingDown size={16} className="text-[#737373]" strokeWidth={1.5} />
                <h3 className="text-base font-semibold tracking-tight text-[#FAFAFA]">AI расход по дням</h3>
              </div>
              {dailyUsage && dailyUsage.length > 0 ? (
                <div className="space-y-2.5">
                  {dailyUsage.slice(-7).map((day) => {
                    const maxCost = Math.max(...dailyUsage.map(d => d.cost), 0.01)
                    const pct = Math.min(100, (day.cost / maxCost) * 100)
                    return (
                      <div key={day.date} className="flex items-center gap-3 text-sm">
                        <span className="text-[#737373] text-xs w-16 shrink-0 tracking-tight">{formatDate(day.date)}</span>
                        <div className="flex-1 bg-[#1A1A1A] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#3B82F6] rounded-full h-1.5 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs w-14 text-right text-[#A3A3A3]">${day.cost.toFixed(2)}</span>
                        <span className="text-[#737373] text-xs w-6 text-right">{day.conversations}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-[#737373] text-sm">Нет данных за текущий период</p>
              )}
            </Card>
          </div>

          {/* Token usage details */}
          <Card>
            <h3 className="text-base font-semibold tracking-tight mb-5 text-[#FAFAFA]">Расход токенов (текущий месяц)</h3>
            {dailyUsage && dailyUsage.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#262626] text-left">
                      <th className="pb-3 font-medium text-[#737373] text-xs uppercase tracking-wider">Дата</th>
                      <th className="pb-3 font-medium text-[#737373] text-xs uppercase tracking-wider">Диалоги</th>
                      <th className="pb-3 font-medium text-[#737373] text-xs uppercase tracking-wider">Prompt</th>
                      <th className="pb-3 font-medium text-[#737373] text-xs uppercase tracking-wider">Completion</th>
                      <th className="pb-3 font-medium text-[#737373] text-xs uppercase tracking-wider text-right">Стоимость</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A]">
                    {dailyUsage.map((day) => (
                      <tr key={day.date} className="hover:bg-[#1A1A1A] transition-colors">
                        <td className="py-2.5 tracking-tight text-[#FAFAFA]">{formatDate(day.date)}</td>
                        <td className="py-2.5 text-[#FAFAFA]">{day.conversations}</td>
                        <td className="py-2.5 font-mono text-xs text-[#A3A3A3]">{day.prompt_tokens.toLocaleString()}</td>
                        <td className="py-2.5 font-mono text-xs text-[#A3A3A3]">{day.completion_tokens.toLocaleString()}</td>
                        <td className="py-2.5 font-mono text-xs text-right text-[#FAFAFA]">${day.cost.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[#262626] font-medium">
                      <td className="pt-3 tracking-tight text-[#FAFAFA]">Итого</td>
                      <td className="pt-3 text-[#FAFAFA]">{dailyUsage.reduce((s, d) => s + d.conversations, 0)}</td>
                      <td className="pt-3 font-mono text-xs text-[#A3A3A3]">
                        {dailyUsage.reduce((s, d) => s + d.prompt_tokens, 0).toLocaleString()}
                      </td>
                      <td className="pt-3 font-mono text-xs text-[#A3A3A3]">
                        {dailyUsage.reduce((s, d) => s + d.completion_tokens, 0).toLocaleString()}
                      </td>
                      <td className="pt-3 font-mono text-xs text-right text-[#FAFAFA]">
                        ${dailyUsage.reduce((s, d) => s + d.cost, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-[#737373] text-sm">Нет данных о расходе токенов</p>
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
