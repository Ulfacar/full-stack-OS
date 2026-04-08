'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import type { BillingRecord } from '@/lib/types'

type StatusFilter = 'all' | 'paid' | 'pending' | 'overdue'

export default function BillingPage() {
  const [filter, setFilter] = useState<StatusFilter>('all')

  const { data: records, isLoading } = useQuery({
    queryKey: ['billing', filter],
    queryFn: async () => {
      try {
        const params = filter !== 'all' ? `?status=${filter}` : ''
        const response = await api.get(`/admin/billing/${params}`)
        return response.data as BillingRecord[]
      } catch {
        return generateMockBilling()
      }
    },
  })

  const filteredRecords = records?.filter(
    r => filter === 'all' || r.status === filter
  ) || []

  const totalPaid = records?.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0) || 0
  const totalPending = records?.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0) || 0
  const totalOverdue = records?.filter(r => r.status === 'overdue').reduce((s, r) => s + r.amount, 0) || 0

  const filterButtons: { label: string; value: StatusFilter }[] = [
    { label: 'Все', value: 'all' },
    { label: 'Оплачено', value: 'paid' },
    { label: 'Ожидает', value: 'pending' },
    { label: 'Просрочено', value: 'overdue' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-neutral-900 mb-1">
          Биллинг
        </h1>
        <p className="text-neutral-500 text-sm">
          Оплаты подписок по месяцам
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 lg:gap-4 mb-6 lg:mb-8">
        <Card className="p-4">
          <div className="text-xl lg:text-2xl font-semibold text-green-600">${totalPaid}</div>
          <div className="text-xs text-neutral-500">Оплачено</div>
        </Card>
        <Card className="p-4">
          <div className="text-xl lg:text-2xl font-semibold text-orange-500">${totalPending}</div>
          <div className="text-xs text-neutral-500">Ожидает</div>
        </Card>
        <Card className="p-4">
          <div className="text-xl lg:text-2xl font-semibold text-red-600">${totalOverdue}</div>
          <div className="text-xs text-neutral-500">Просрочено</div>
        </Card>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {filterButtons.map((btn) => (
          <Button
            key={btn.value}
            variant={filter === btn.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(btn.value)}
            className="whitespace-nowrap"
          >
            {btn.label}
          </Button>
        ))}
      </div>

      {isLoading && (
        <div className="text-center py-12 text-neutral-400">Загрузка...</div>
      )}

      {/* Desktop table */}
      {!isLoading && filteredRecords.length > 0 && (
        <>
          <Card className="hidden lg:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left">
                    <th className="pb-3 font-medium text-neutral-500">Отель</th>
                    <th className="pb-3 font-medium text-neutral-500">Месяц</th>
                    <th className="pb-3 font-medium text-neutral-500">Сумма</th>
                    <th className="pb-3 font-medium text-neutral-500">Статус</th>
                    <th className="pb-3 font-medium text-neutral-500">Дата оплаты</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-neutral-50">
                      <td className="py-3 font-medium">{record.hotel_name}</td>
                      <td className="py-3">{formatMonth(record.month)}</td>
                      <td className="py-3 font-mono">${record.amount}</td>
                      <td className="py-3">
                        <BillingBadge status={record.status} />
                      </td>
                      <td className="py-3 text-neutral-500">
                        {record.paid_at ? new Date(record.paid_at).toLocaleDateString('ru-RU') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {filteredRecords.map((record) => (
              <Card key={record.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{record.hotel_name}</span>
                  <BillingBadge status={record.status} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">{formatMonth(record.month)}</span>
                  <span className="font-mono font-medium">${record.amount}</span>
                </div>
                {record.paid_at && (
                  <div className="text-xs text-neutral-400 mt-1">
                    Оплачено: {new Date(record.paid_at).toLocaleDateString('ru-RU')}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      {!isLoading && filteredRecords.length === 0 && (
        <Card className="text-center py-12">
          <div className="text-4xl mb-3">💰</div>
          <p className="text-neutral-500">Нет записей по выбранному фильтру</p>
        </Card>
      )}
    </div>
  )
}

function BillingBadge({ status }: { status: BillingRecord['status'] }) {
  const map = {
    paid: { variant: 'success' as const, label: 'Оплачено' },
    pending: { variant: 'warning' as const, label: 'Ожидает' },
    overdue: { variant: 'error' as const, label: 'Просрочено' },
  }
  const { variant, label } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-')
  const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
  return `${months[parseInt(month) - 1]} ${year}`
}

function generateMockBilling(): BillingRecord[] {
  return [
    {
      id: 1,
      hotel_id: 1,
      hotel_name: 'Ton Azure',
      month: '2026-04',
      amount: 20,
      status: 'paid',
      paid_at: '2026-04-02T10:00:00',
      created_at: '2026-04-01',
    },
    {
      id: 2,
      hotel_id: 1,
      hotel_name: 'Ton Azure',
      month: '2026-03',
      amount: 20,
      status: 'paid',
      paid_at: '2026-03-03T10:00:00',
      created_at: '2026-03-01',
    },
    {
      id: 3,
      hotel_id: 2,
      hotel_name: 'Hotel Issyk-Kul',
      month: '2026-04',
      amount: 20,
      status: 'pending',
      paid_at: null,
      created_at: '2026-04-01',
    },
  ]
}
