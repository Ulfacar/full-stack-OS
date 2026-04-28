'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import api from '@/lib/api'

interface MonthlyReport {
  hotel_id: number
  hotel_name: string
  month: string
  total_dialogs: number
  booking_dialogs: number
  confirmed_bookings: number
  saved_revenue_usd: number
  avg_booking_price_usd: number
  subscription_fee_usd: number
  roi_x: number
}

function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  return d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
}

function downloadCSV(report: MonthlyReport): void {
  const rows = [
    ['Метрика', 'Значение'],
    ['Месяц', report.month],
    ['Отель', report.hotel_name],
    ['Всего диалогов', String(report.total_dialogs)],
    ['Диалоги о брони', String(report.booking_dialogs)],
    ['Подтверждённых броней', String(report.confirmed_bookings)],
    ['Средний чек, USD', String(report.avg_booking_price_usd)],
    ['Сохранённая выручка, USD', String(report.saved_revenue_usd)],
    ['Подписка Ex-Machina, USD/мес', String(report.subscription_fee_usd)],
    ['ROI', `${report.roi_x}x`],
  ]
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  // Prefix with BOM so Excel respects UTF-8 (Cyrillic friendly)
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `roi_${report.hotel_name.replace(/\s+/g, '_')}_${report.month}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function ReportsPage() {
  const params = useParams()
  const hotelId = Number(params.id)

  const [month, setMonth] = useState(currentMonth())
  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get<MonthlyReport>(
          `/api/reports/monthly?hotel_id=${hotelId}&month=${month}`,
        )
        if (!cancelled) setReport(res.data)
      } catch (err: any) {
        if (cancelled) return
        const code = err?.response?.status
        if (code === 404) setError('Отель не найден или у вас нет доступа.')
        else if (code === 422) setError('Неверный формат месяца. Ожидается YYYY-MM.')
        else if (code === 401) setError('Сессия истекла — войдите заново.')
        else setError('Не удалось загрузить отчёт.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [hotelId, month])

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <Link
            href={`/dashboard/hotels/${hotelId}`}
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            ← К отелю
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-[#FAFAFA] mt-1">
            ROI-отчёт
          </h1>
          <p className="text-[#737373] text-sm">
            Сколько подтверждённой брони вы получили за месяц vs. подписки $40/мес.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label className="text-xs text-[#737373] block mb-1">Месяц</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value || currentMonth())}
              className="bg-[#0F0F0F] border border-[#262626] rounded-md px-3 py-1.5 text-sm text-[#FAFAFA]"
            />
          </div>
          <button
            type="button"
            onClick={() => report && downloadCSV(report)}
            disabled={!report}
            className="text-sm border border-[#262626] hover:bg-[#1A1A1A] disabled:opacity-50 px-4 py-2 rounded-md text-[#D4D4D4]"
          >
            CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 mb-4">
          {error}
        </div>
      )}

      {loading && !report && <div className="text-zinc-500">Загрузка…</div>}

      {report && (
        <>
          {/* Hero ROI */}
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-[#0F0F0F] p-8 mb-6">
            <div className="text-xs text-emerald-300 uppercase tracking-wider mb-1">
              ROI за {formatMonthLabel(report.month)}
            </div>
            <div className="text-5xl md:text-6xl font-semibold text-emerald-300 mb-2">
              {report.roi_x}×
            </div>
            <div className="text-sm text-[#A3A3A3] max-w-2xl">
              ${report.saved_revenue_usd.toLocaleString('ru-RU')} подтверждённой брони
              ÷ ${report.subscription_fee_usd}/мес подписка ={' '}
              <span className="text-emerald-300 font-medium">{report.roi_x}× возврат инвестиций.</span>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <KpiCard label="Всего диалогов" value={report.total_dialogs} hint="Активность за месяц" />
            <KpiCard label="Броневых диалогов" value={report.booking_dialogs} hint="Категория «booking»" />
            <KpiCard
              label="Подтверждённых броней"
              value={report.confirmed_bookings}
              hint="Менеджер нажал «Подтвердить»"
            />
            <KpiCard
              label="Сохранённая выручка"
              value={`$${report.saved_revenue_usd.toLocaleString('ru-RU')}`}
              hint="Сумма всех броней"
            />
          </div>

          {/* Footer note */}
          <div className="rounded-xl border border-[#262626] bg-[#0F0F0F] p-5 text-sm text-[#A3A3A3]">
            <p>
              <strong className="text-[#FAFAFA]">Как читать.</strong> ROI считается так:{' '}
              <code className="bg-[#1A1A1A] px-1.5 py-0.5 rounded text-xs text-emerald-300">
                сохранённая выручка / подписка
              </code>
              . Сохранённая выручка — это сумма всех броней, которые менеджер
              подтвердил в админке («Подтвердить бронь $»). Подписка — фиксированная
              ($40/мес для тарифа Назиры).
            </p>
            <p className="mt-2">
              Если ROI меньше 5× — пора пересмотреть тариф или дозаполнить промпт.
              5-30× — здоровый продукт. 30×+ — клиент влюблён, churn ≈ 0.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string
  value: number | string
  hint: string
}) {
  return (
    <div className="rounded-xl border border-[#262626] bg-[#0F0F0F] p-4">
      <div className="text-xs text-[#737373] uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-semibold text-[#FAFAFA]">{value}</div>
      <div className="text-xs text-[#737373] mt-1">{hint}</div>
    </div>
  )
}
