'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

const SUBSCRIPTION_FEE_USD = 40
const ASSUMED_AUTOMATION_RATE = 0.8 // 80%, basis: Ton Azure 82% averaged down
const ASSUMED_BOOKING_CONVERSION = 0.4 // 40% of automated dialogs end with confirmed booking

const fmtMoney = (n: number) => `$${n.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}`

export function RoiCalculator() {
  const [rooms, setRooms] = useState(22)
  const [avgPrice, setAvgPrice] = useState(120)
  const [dialogsPerMonth, setDialogsPerMonth] = useState(50)

  const calc = useMemo(() => {
    const automated = Math.round(dialogsPerMonth * ASSUMED_AUTOMATION_RATE)
    const bookings = Math.round(automated * ASSUMED_BOOKING_CONVERSION)
    const revenue = bookings * avgPrice
    const roi = revenue / SUBSCRIPTION_FEE_USD
    const netSavings = revenue - SUBSCRIPTION_FEE_USD
    return {
      automated,
      bookings,
      revenue,
      roi: Math.round(roi),
      netSavings,
    }
  }, [dialogsPerMonth, avgPrice])

  return (
    <section id="roi" className="py-20 md:py-28 bg-[#0A0A0A] border-t border-[#1A1A1A]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-10 md:mb-12">
          <div className="text-xs text-emerald-300 uppercase tracking-wider mb-2">
            ROI калькулятор
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
            Сколько окупится для вашего отеля?
          </h2>
          <p className="text-sm md:text-base text-[#A3A3A3] max-w-2xl mx-auto">
            Подвиньте ползунки под свой отель. Расчёт строится на метриках Ton Azure
            (80% автоматизация, 40% конверсия диалога в бронь).
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
          {/* Inputs */}
          <div className="space-y-6">
            <Slider
              label="Номеров в отеле"
              hint={`${rooms} номеров`}
              value={rooms}
              min={5}
              max={100}
              step={1}
              onChange={setRooms}
              unit=""
            />
            <Slider
              label="Средний чек брони"
              hint={`${fmtMoney(avgPrice)}`}
              value={avgPrice}
              min={50}
              max={300}
              step={10}
              onChange={setAvgPrice}
              unit="$"
            />
            <Slider
              label="Диалогов в WhatsApp / Telegram в месяц"
              hint={`${dialogsPerMonth} диалогов`}
              value={dialogsPerMonth}
              min={10}
              max={250}
              step={5}
              onChange={setDialogsPerMonth}
              unit=""
            />

            <div className="text-xs text-[#737373] pt-2 border-t border-[#1A1A1A]">
              Не уверены в цифрах? Берите средний день в высокий сезон × 30. Если у
              вас 20 номеров и 60-70% загрузка — обычно 40-80 диалогов/мес.
            </div>
          </div>

          {/* Output */}
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-[#0F0F0F] p-6 md:p-8 flex flex-col">
            <div className="text-xs text-emerald-300 uppercase tracking-wider mb-1">
              Ваш ROI с Ex-Machina
            </div>
            <div className="text-5xl md:text-6xl font-semibold text-emerald-300 mb-1">
              {calc.roi}×
            </div>
            <div className="text-sm text-[#A3A3A3] mb-6">
              {fmtMoney(calc.revenue)} выручки ÷ ${SUBSCRIPTION_FEE_USD}/мес подписка
            </div>

            <div className="space-y-2.5 text-sm mb-6">
              <Row k="Автоматизированных диалогов" v={`${calc.automated} / ${dialogsPerMonth}`} />
              <Row k="Подтверждённых броней (оценка)" v={`${calc.bookings}`} />
              <Row k="Выручка через бот" v={fmtMoney(calc.revenue)} accent />
              <Row k="Минус подписка $40/мес" v={`-${fmtMoney(SUBSCRIPTION_FEE_USD)}`} />
              <div className="pt-2 mt-2 border-t border-emerald-500/20 flex justify-between">
                <span className="text-[#FAFAFA] font-medium">Чистая экономия</span>
                <span className="text-emerald-300 font-semibold">{fmtMoney(calc.netSavings)}/мес</span>
              </div>
            </div>

            <Link
              href="/create-bot"
              className="inline-block bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-medium px-5 py-2.5 rounded-md text-center"
            >
              Получить такие цифры в свой отель →
            </Link>
            <Link
              href="/cases/ton-azure"
              className="text-xs text-[#A3A3A3] hover:text-[#FAFAFA] mt-3 text-center"
            >
              Откуда эти проценты? Смотрите кейс Ton Azure →
            </Link>
          </div>
        </div>

        <p className="text-[11px] text-zinc-600 mt-8 text-center max-w-2xl mx-auto">
          Расчёт ориентировочный. Реальная конверсия зависит от качества промпта,
          загрузки отеля и сезона. Калькулятор настроен под mini-hotel КР (15-40
          номеров). Для отелей 80+ обращайтесь напрямую — у нас отдельный тариф.
        </p>
      </div>
    </section>
  )
}

function Slider({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
  unit,
}: {
  label: string
  hint: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  unit: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm text-[#FAFAFA] font-medium">{label}</label>
        <span className="text-sm text-emerald-300 font-mono">{hint}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-[#1A1A1A] rounded-full appearance-none cursor-pointer accent-emerald-500"
      />
      <div className="flex justify-between text-[11px] text-zinc-600 mt-1">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  )
}

function Row({ k, v, accent = false }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-[#A3A3A3]">{k}</span>
      <span className={accent ? 'text-emerald-300 font-medium' : 'text-[#D4D4D4]'}>{v}</span>
    </div>
  )
}
