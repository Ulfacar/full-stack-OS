import Link from 'next/link'

export const metadata = {
  title: 'Сравнить AI-бота для отеля в КР — Ex-Machina vs NURAI vs in-house',
  description:
    'Прямое сравнение Ex-Machina, NURAI и решения с программистом-фрилансером для мини-отеля в Кыргызстане: цена, сроки, PMS, языки, кейсы.',
}

interface Cell {
  text: string
  hint?: string
  tone?: 'good' | 'bad' | 'neutral'
}

interface Row {
  criterion: string
  ex: Cell
  nurai: Cell
  inhouse: Cell
}

const rows: Row[] = [
  {
    criterion: 'Срок запуска',
    ex: { text: '10–15 минут', hint: 'визард на сайте, бот в TG за 5 мин', tone: 'good' },
    nurai: { text: '3–7 дней', hint: 'анкета → ручная настройка их командой', tone: 'neutral' },
    inhouse: { text: '4–12 недель', hint: 'найм + ТЗ + первая итерация + тесты', tone: 'bad' },
  },
  {
    criterion: 'Цена',
    ex: { text: '$800 setup + $40/мес', hint: 'Wappi $10/мес отдельно', tone: 'good' },
    nurai: { text: '$0 setup + $79–349/мес', hint: 'Start 500 чатов / Pro 4000 чатов', tone: 'neutral' },
    inhouse: {
      text: '$1500–3000 + $200/мес',
      hint: 'программист junior 2–3 нед + поддержка',
      tone: 'bad',
    },
  },
  {
    criterion: 'PMS-интеграции',
    ex: {
      text: 'Exely (R2, июнь 2026)',
      hint: 'PMS №1 в мини-отелях КР, в роадмапе',
      tone: 'good',
    },
    nurai: { text: 'amoCRM, Битрикс24, Altegio', hint: 'Exely нет', tone: 'bad' },
    inhouse: { text: 'Только если заложите в ТЗ', hint: 'отдельная разработка', tone: 'bad' },
  },
  {
    criterion: 'WhatsApp + Telegram',
    ex: {
      text: '✅ оба канала',
      hint: 'Wappi.pro для WA + Bot API для TG',
      tone: 'good',
    },
    nurai: { text: '✅ WA + TG + Instagram', hint: 'все тарифы', tone: 'good' },
    inhouse: { text: '⚠️ нужно решить отдельно', hint: 'Wappi/Meta API + boilerplate', tone: 'bad' },
  },
  {
    criterion: 'Локальность КР',
    ex: {
      text: 'Кыргызский язык, $ для КР, реквизиты МБанк/MegaPay',
      hint: 'фокус-вертикаль mini-hotel КР',
      tone: 'good',
    },
    nurai: {
      text: 'Универсальный AI без отельной специфики',
      hint: 'нет отельных кейсов, KG-mix не отрабатывает',
      tone: 'bad',
    },
    inhouse: {
      text: 'Зависит от программиста',
      hint: 'если знает рынок отелей КР — повезло',
      tone: 'neutral',
    },
  },
  {
    criterion: 'Кейсы в отельной вертикали КР',
    ex: {
      text: 'Ton Azure, 58 диалогов/мес, 82% автоматизация',
      hint: 'реальный production-клиент, апрель 2026',
      tone: 'good',
    },
    nurai: {
      text: '0 отельных кейсов на сайте',
      hint: 'Эклектика, Disney Lash, Smart Kurulush — образование/салоны/стройка',
      tone: 'bad',
    },
    inhouse: { text: '—', hint: 'отельная экспертиза не входит в найм', tone: 'bad' },
  },
]

const toneClass: Record<NonNullable<Cell['tone']>, string> = {
  good: 'text-emerald-300',
  bad: 'text-red-300',
  neutral: 'text-zinc-300',
}

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <Link
          href="/"
          className="text-sm text-[#3B82F6] hover:underline inline-block mb-8"
        >
          ← На главную
        </Link>

        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
          Ex-Machina vs NURAI vs «возьмём программиста»
        </h1>
        <p className="text-[#A3A3A3] mb-3 max-w-2xl">
          Если вы выбираете AI-ассистента для мини-отеля в КР — вот честное
          сравнение по 6 критериям, которые реально влияют на сезонную выручку.
        </p>
        <p className="text-xs text-zinc-600 mb-10">
          Данные на 2026-04-28. Цены и интеграции обновляются — актуальное всегда
          у нас в WhatsApp.
        </p>

        {/* Desktop / wide table */}
        <div className="hidden md:block overflow-hidden rounded-xl border border-[#262626]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#141414] text-left">
                <th className="px-4 py-3 font-medium text-zinc-400 w-1/4">Критерий</th>
                <th className="px-4 py-3 font-medium w-1/4">
                  <span className="text-[#3B82F6]">Ex-Machina</span>
                </th>
                <th className="px-4 py-3 font-medium w-1/4 text-zinc-300">NURAI</th>
                <th className="px-4 py-3 font-medium w-1/4 text-zinc-300">In-house (программист)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.criterion}
                  className={i % 2 === 0 ? 'bg-[#0F0F0F]' : 'bg-[#0A0A0A]'}
                >
                  <td className="px-4 py-4 align-top text-zinc-400 font-medium">
                    {r.criterion}
                  </td>
                  <Cell cell={r.ex} highlight />
                  <Cell cell={r.nurai} />
                  <Cell cell={r.inhouse} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile / stacked */}
        <div className="md:hidden space-y-4">
          {rows.map((r) => (
            <div
              key={r.criterion}
              className="rounded-xl border border-[#262626] bg-[#0F0F0F] p-4"
            >
              <h3 className="text-zinc-400 text-xs uppercase tracking-wide mb-3">
                {r.criterion}
              </h3>
              <MobileRow label="Ex-Machina" cell={r.ex} highlight />
              <MobileRow label="NURAI" cell={r.nurai} />
              <MobileRow label="In-house" cell={r.inhouse} />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/5 p-6">
          <h2 className="text-xl font-semibold mb-2">
            Что выбрать для отеля 18–40 номеров в КР?
          </h2>
          <p className="text-sm text-[#A3A3A3] mb-4 max-w-2xl">
            Если хотите бот за 15 минут с реальными отельными кейсами в КР и
            планом на Exely — Ex-Machina. Если нужен универсальный CRM-чат для
            школы или салона — NURAI. Если нужно полностью кастомное решение и
            у вас есть 2-3 месяца на разработку — наймите программиста.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/create-bot"
              className="text-sm bg-[#3B82F6] hover:bg-[#2563EB] text-white px-5 py-2.5 rounded-md font-medium"
            >
              Начать с Ex-Machina →
            </Link>
            <Link
              href="/cases/ton-azure"
              className="text-sm border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 px-5 py-2.5 rounded-md"
            >
              Кейс Ton Azure
            </Link>
            <Link
              href="/login"
              className="text-sm border border-[#262626] text-[#D4D4D4] hover:bg-[#1A1A1A] px-5 py-2.5 rounded-md"
            >
              Смотреть демо
            </Link>
          </div>
        </div>

        <p className="text-[11px] text-zinc-600 mt-8">
          Сравнение составлено на основе публичной информации с сайтов
          конкурентов (nurai.one — апрель 2026), их прайс-листов и переписки с
          их sales-командами. Если что-то изменилось — напишите нам, мы поправим.
        </p>
      </div>
    </div>
  )
}

function Cell({ cell, highlight = false }: { cell: Cell; highlight?: boolean }) {
  const tone = cell.tone ?? 'neutral'
  return (
    <td
      className={`px-4 py-4 align-top ${
        highlight ? 'bg-[#3B82F6]/5 border-l border-[#3B82F6]/20' : ''
      }`}
    >
      <div className={`text-sm ${toneClass[tone]}`}>{cell.text}</div>
      {cell.hint && (
        <div className="text-[11px] text-zinc-500 mt-1">{cell.hint}</div>
      )}
    </td>
  )
}

function MobileRow({
  label,
  cell,
  highlight = false,
}: {
  label: string
  cell: Cell
  highlight?: boolean
}) {
  const tone = cell.tone ?? 'neutral'
  return (
    <div
      className={`mb-2 last:mb-0 pl-3 border-l-2 ${
        highlight ? 'border-[#3B82F6]' : 'border-[#262626]'
      }`}
    >
      <div className={`text-xs uppercase tracking-wide ${highlight ? 'text-[#3B82F6]' : 'text-zinc-500'}`}>
        {label}
      </div>
      <div className={`text-sm ${toneClass[tone]}`}>{cell.text}</div>
      {cell.hint && <div className="text-[11px] text-zinc-500 mt-0.5">{cell.hint}</div>}
    </div>
  )
}
