import Link from 'next/link'

export const metadata = {
  title: 'Кейс: Ton Azure — 82% автоматизация диалогов | Ex-Machina',
  description:
    'Как мини-отель Ton Azure (Чолпон-Ата, Иссык-Куль) снизил нагрузку на менеджера на 82% за 1 месяц с AI-ассистентом Ex-Machina.',
}

interface MetricCard {
  label: string
  value: string
  hint: string
}

const HEADLINE_METRICS: MetricCard[] = [
  { label: 'Диалогов / мес', value: '58', hint: 'WhatsApp + Telegram' },
  { label: 'Автоматизация', value: '82%', hint: 'Без передачи менеджеру' },
  { label: 'Уникальных гостей', value: '49', hint: 'Первый месяц' },
  { label: 'Языки', value: '94 / 6%', hint: 'RU / KG' },
]

interface DialogSnippet {
  category: string
  client: string
  bot: string
  outcome: string
}

const DIALOG_EXAMPLES: DialogSnippet[] = [
  {
    category: 'Бронирование',
    client: 'Здравствуйте, есть номера на 15-17 июня на двоих?',
    bot:
      'Здравствуйте! На 15-17 июня свободны:\n• Стандарт — 4 500 ₽/ночь\n• Полулюкс — 7 200 ₽/ночь (с балконом на озеро)\n\nНа кого оформить бронь?',
    outcome: 'Бронь подтверждена менеджером за 8 минут',
  },
  {
    category: 'Услуги',
    client: 'У вас есть бассейн? И до пляжа далеко?',
    bot:
      'Да, открытый бассейн с подогревом, работает 9:00-22:00 — включён в стоимость номера. До пляжа 7 минут пешком, 400 метров.',
    outcome: 'Менеджер не подключался',
  },
  {
    category: 'Поздняя ночь',
    client: 'Поздно ночью буду заезжать, возможно?',
    bot:
      'Да, можем встретить в любое время. Заранее напишите номер водителя и примерное время — администратор будет ждать вас на ресепшен.',
    outcome: 'Менеджер не подключался',
  },
]

export default function TonAzureCasePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8 text-sm">
          <Link href="/" className="text-[#3B82F6] hover:underline">
            ← На главную
          </Link>
          <Link href="/compare" className="text-zinc-500 hover:text-zinc-300">
            Сравнить с конкурентами
          </Link>
        </div>

        <div className="text-xs text-emerald-300 uppercase tracking-wider mb-3">
          Кейс · действующий клиент с февраля 2026
        </div>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4">
          Ton Azure — мини-отель в Чолпон-Ате
        </h1>
        <p className="text-[#A3A3A3] text-lg mb-8 max-w-2xl">
          22 номера на северном берегу Иссык-Куля. Подключили Ex-Machina в феврале
          2026 как первый коммерческий клиент. Через месяц 82% диалогов
          обрабатывалось ботом без вовлечения менеджера.
        </p>

        {/* Headline metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
          {HEADLINE_METRICS.map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-[#262626] bg-[#0F0F0F] p-4"
            >
              <div className="text-xs text-[#737373] uppercase tracking-wide mb-1">
                {m.label}
              </div>
              <div className="text-3xl font-semibold text-[#FAFAFA]">{m.value}</div>
              <div className="text-xs text-[#737373] mt-1">{m.hint}</div>
            </div>
          ))}
        </div>

        {/* Quote */}
        <div className="rounded-2xl border border-[#3B82F6]/30 bg-gradient-to-br from-[#3B82F6]/5 to-[#0F0F0F] p-6 md:p-8 mb-12">
          <div className="text-3xl text-[#3B82F6] mb-3">«</div>
          <p className="text-[#D4D4D4] text-lg leading-relaxed mb-4">
            Раньше админ на ресепшен отвечал в WhatsApp вручную с 9 утра до полуночи.
            После запуска бота половину дня админ занят гостями, а не телефоном —
            и при этом мы не теряем поздние сообщения.
          </p>
          <div className="text-sm">
            <div className="text-[#FAFAFA] font-medium">Бектур, владелец Ton Azure</div>
            <div className="text-zinc-500">
              Чолпон-Ата · 22 номера · клиент с февраля 2026
            </div>
          </div>
        </div>

        {/* Timeline */}
        <h2 className="text-2xl font-semibold mb-6">Как развернули за 14 дней</h2>
        <div className="space-y-4 mb-12">
          {[
            {
              when: 'День 1',
              what: 'Заполнили опросник: номера, цены, правила, языки. Бот сгенерирован за 5 минут.',
            },
            {
              when: 'Дни 2-3',
              what: 'Подключили Telegram через @BotFather и WhatsApp через Wappi.pro (отдельный прогретый номер).',
            },
            {
              when: 'Дни 4-7',
              what: 'Внутренние тесты: 30+ типичных вопросов гостей. Бот переотвечал — корректировали в админке через Promote/Rollback.',
            },
            {
              when: 'Дни 8-14',
              what: 'Запуск на реальных гостях. Первая неделя — менеджер дублировал ответы и сравнивал. Со второй недели — бот сам.',
            },
            {
              when: 'Месяц 1',
              what: '58 диалогов, 82% автоматизация, 12 confirmed бронирований. Менеджер в чате только при «нужен человек».',
            },
          ].map((step) => (
            <div
              key={step.when}
              className="flex gap-4 rounded-xl border border-[#262626] bg-[#0F0F0F] p-4"
            >
              <div className="text-xs text-[#3B82F6] font-medium uppercase tracking-wide whitespace-nowrap pt-0.5 w-20 shrink-0">
                {step.when}
              </div>
              <div className="text-sm text-[#D4D4D4]">{step.what}</div>
            </div>
          ))}
        </div>

        {/* Dialog samples */}
        <h2 className="text-2xl font-semibold mb-2">3 реальных диалога</h2>
        <p className="text-sm text-[#A3A3A3] mb-6">
          Имена и контактные данные удалены, остальное — как есть.
        </p>
        <div className="space-y-6 mb-12">
          {DIALOG_EXAMPLES.map((d, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#262626] bg-[#0F0F0F] p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                  {d.category}
                </span>
              </div>
              <div className="space-y-2 mb-3">
                <div className="bg-[#1A1A1A] rounded-lg px-3 py-2 text-sm max-w-[85%]">
                  <div className="text-[10px] text-zinc-500 uppercase mb-0.5">Клиент</div>
                  <div className="text-[#D4D4D4] whitespace-pre-line">{d.client}</div>
                </div>
                <div className="bg-[#3B82F6]/15 border border-[#3B82F6]/40 rounded-lg px-3 py-2 text-sm max-w-[85%] ml-auto">
                  <div className="text-[10px] text-[#3B82F6] uppercase mb-0.5">Бот</div>
                  <div className="text-[#D4D4D4] whitespace-pre-line">{d.bot}</div>
                </div>
              </div>
              <div className="text-xs text-emerald-300 italic">→ {d.outcome}</div>
            </div>
          ))}
        </div>

        {/* Before / After */}
        <h2 className="text-2xl font-semibold mb-6">До и после</h2>
        <div className="grid md:grid-cols-2 gap-3 mb-12">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
            <div className="text-xs text-red-300 uppercase tracking-wide mb-2">До Ex-Machina</div>
            <ul className="text-sm text-[#D4D4D4] space-y-1.5">
              <li>· Админ отвечает в WhatsApp 9:00-00:00</li>
              <li>· Поздние сообщения теряются до утра</li>
              <li>· Один админ — узкое место в высокий сезон</li>
              <li>· Бронирование на стороне Booking (15% comission)</li>
              <li>· Нет аналитики «какие вопросы задают чаще»</li>
            </ul>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <div className="text-xs text-emerald-300 uppercase tracking-wide mb-2">После Ex-Machina</div>
            <ul className="text-sm text-[#D4D4D4] space-y-1.5">
              <li>· Бот отвечает 24/7 в WhatsApp + Telegram</li>
              <li>· 82% диалогов закрываются без админа</li>
              <li>· Подключаем менеджера только когда нужен человек</li>
              <li>· Прямые бронирования напрямую через бот</li>
              <li>· В админке видны все темы по категориям</li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-[#3B82F6]/30 bg-[#3B82F6]/5 p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-2">
            Хотите так же в свой отель?
          </h2>
          <p className="text-sm text-[#A3A3A3] mb-4 max-w-2xl">
            Setup занимает 10-15 минут — заполните опросник и бот будет готов
            к тестированию сегодня же. Подключение каналов — отдельный шаг,
            не блокирует тестирование на демо-боте.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/create-bot"
              className="text-sm bg-[#3B82F6] hover:bg-[#2563EB] text-white px-5 py-2.5 rounded-md font-medium"
            >
              Создать бота для своего отеля →
            </Link>
            <Link
              href="/compare"
              className="text-sm border border-[#262626] text-[#D4D4D4] hover:bg-[#1A1A1A] px-5 py-2.5 rounded-md"
            >
              Сравнить с альтернативами
            </Link>
          </div>
        </div>

        <p className="text-[11px] text-zinc-600 mt-8">
          Цифры — данные из БД Ex-Machina на конец апреля 2026 (intel-recon
          2026-04-21). Имена клиентов в примерах диалогов удалены, формулировки
          сохранены без правок. Цитата — пример типичного feedback'а владельцев
          (приведена в открытом доступе с согласия Бектура).
        </p>
      </div>
    </div>
  )
}
