'use client'

import { useState } from 'react'
import Link from 'next/link'

interface QA {
  q: string
  a: React.ReactNode
}

interface Section {
  title: string
  badge: string
  items: QA[]
}

const SECTIONS: Section[] = [
  {
    title: 'WhatsApp и Wappi.pro',
    badge: '💬 WA',
    items: [
      {
        q: 'Должен ли мой телефон быть постоянно включён?',
        a: (
          <>
            <strong>Нет.</strong> Wappi.pro работает на их сервере. Ваш телефон нужен
            только для первичной привязки QR-кодом и иногда для повторной авторизации
            (раз в 2-4 недели). В остальное время телефон может лежать в сейфе отеля,
            бот будет отвечать клиентам круглосуточно.
          </>
        ),
      },
      {
        q: 'Какой номер использовать для бота — личный или новый?',
        a: (
          <>
            <strong>Только новый.</strong> Если WhatsApp забанит номер из-за рассылки,
            вы потеряете и личную переписку, и канал отеля. SIM от любого оператора КР
            ($5/мес) окупается одной непотерянной бронью. Подробности — в{' '}
            <Link href="/guides/wa-onboarding" className="text-[#3B82F6] hover:underline">
              гайде по подключению WhatsApp
            </Link>
            .
          </>
        ),
      },
      {
        q: 'Есть риск что номер забанят?',
        a: (
          <>
            Есть, если нарушать анти-бан правила (массовая рассылка, спам, не-прогретый
            номер). Бот соблюдает первые 3 правила автоматически (debounce 1.5 сек,
            персонализация, без спама), вам остаётся:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Прогреть новый номер 7-14 дней до запуска бота</li>
              <li>Не делать массовые ручные рассылки с того же номера</li>
              <li>Не использовать номер с предыдущим баном</li>
            </ul>
            Если бан всё-таки случился — мы помогаем перенастроить бота на запасной номер
            за 10 минут.
          </>
        ),
      },
      {
        q: 'Сколько стоит Wappi и это входит в подписку Ex-Machina?',
        a: (
          <>
            Wappi — <strong>отдельная подписка</strong>, $10-15/мес за один номер.
            Платится напрямую им. Это покрывает неограниченную отправку в рамках
            лимитов WhatsApp (5-10 msg/мин). Подписка Ex-Machina ($40/мес) — за бота,
            промпты, админку, обновления.
          </>
        ),
      },
    ],
  },
  {
    title: 'PMS — Exely, Altegio, Shelter',
    badge: '🛏️ PMS',
    items: [
      {
        q: 'Вы интегрированы с Exely?',
        a: (
          <>
            <strong>В роадмапе на R2 (июнь 2026).</strong> Сейчас бот квалифицирует
            бронь (даты, гости, номер, контакты) и передаёт менеджеру — менеджер сам
            заводит её в Exely. Это занимает 1-2 минуты на бронь.
            <br />
            <br />
            После R2 (июнь 2026) — auto-confirm: бот сразу занесёт бронь в Exely
            после подтверждения менеджером, без ручной работы. Тариф не повысится для
            существующих клиентов.
          </>
        ),
      },
      {
        q: 'А Altegio? Shelter?',
        a: (
          <>
            <strong>Altegio</strong> — есть нативная поддержка в промпте (бот понимает
            что бронь идёт через Altegio). Полная API-интеграция планируется после
            Exely (R2.5, сентябрь 2026).
            <br />
            <br />
            <strong>Shelter</strong> — поддерживается на уровне промпта, бот
            корректно описывает гостю что «бронь занесена в Shelter». API-интеграция —
            R3, по запросу клиента.
          </>
        ),
      },
      {
        q: 'У меня нет PMS, веду в Google Sheets / блокноте. Подходит?',
        a: (
          <>
            <strong>Да, 60-75% наших клиентов в этом сегменте.</strong> При выборе «нет
            PMS» в визарде бот не обещает гостю «забронировано в системе» — он говорит{' '}
            «передаю менеджеру для подтверждения». Менеджер потом вручную заносит в
            Sheets / блокнот.
            <br />
            <br />
            Когда соберётесь на Exely — переключите тумблер в визарде, бот сразу начнёт
            упоминать Exely в ответах гостям.
          </>
        ),
      },
      {
        q: 'А если я сменю PMS?',
        a: (
          <>
            Открываете админку → меняете тумблер → промпт автоматически перегенерируется
            с новой PMS-секцией. Тестируете через preview-chat (не пишет клиенту, не
            тратит лимит) → жмёте Promote. Полный переход — 5 минут.
          </>
        ),
      },
    ],
  },
  {
    title: 'Безопасность и данные',
    badge: '🔒 Security',
    items: [
      {
        q: 'Где хранятся данные моих клиентов?',
        a: (
          <>
            Postgres-база на Railway (EU/US регион по выбору). Шифрование at rest,
            шифрование в транзите (TLS). Telegram-токены ботов и WhatsApp-токены
            хранятся в БД <strong>зашифрованными</strong> через Fernet — даже при
            компрометации БД токены остаются недоступны без ключа.
          </>
        ),
      },
      {
        q: 'Кто видит переписку клиентов?',
        a: (
          <>
            Только владелец отеля (вы) и его менеджеры (если настроены). Multi-tenant
            архитектура с единым chokepoint — отель A технически не может прочесть
            переписку отеля B даже при компрометации одного аккаунта.
            <br />
            <br />
            Сообщения для AI-ответа отправляются в OpenRouter / OpenAI / Anthropic
            (зависит от выбранной модели). Их политика — не использовать API-данные
            для тренировки моделей (Anthropic Claude — официально, OpenAI — opt-out
            по умолчанию для API).
          </>
        ),
      },
      {
        q: 'Если я перестану пользоваться — что с данными?',
        a: (
          <>
            При отключении подписки — данные удерживаются 90 дней (на случай если
            захотите вернуться). Через 90 дней — полное удаление по запросу. Можем
            подписать NDA если требуется юридическое обоснование.
          </>
        ),
      },
    ],
  },
  {
    title: 'Цены и подписка',
    badge: '💰 Pricing',
    items: [
      {
        q: 'Сколько стоит?',
        a: (
          <>
            Тариф «Назира» (текущий стандарт):
            <br />
            <strong>$800 setup</strong> (одноразово — настройка, обучение промпта,
            тестирование) + <strong>$40/мес подписка</strong> (бот, админка, обновления,
            поддержка).
            <br />
            <br />
            Wappi.pro — отдельно ($10-15/мес). OpenRouter (LLM) — отдельно (~$1-3/мес для
            типового мини-отеля).
            <br />
            <br />
            <Link href="/#roi" className="text-[#3B82F6] hover:underline">
              Посчитайте свой ROI на калькуляторе
            </Link>{' '}
            — обычно окупается за 1-2 подтверждённые брони в месяц.
          </>
        ),
      },
      {
        q: 'Какие способы оплаты?',
        a: (
          <>
            Сейчас — банковский перевод по реквизитам (КГС, USD). На roadmap:
            Kaspi.kz / ElCard / Stripe (Q3 2026, после первых 5 платящих клиентов).
          </>
        ),
      },
      {
        q: 'Есть бесплатная демо-версия?',
        a: (
          <>
            Да, можете бесплатно создать бота через визард, протестировать промпт через
            preview-chat (без подключения к реальным каналам — не пишет клиентам, не
            тратит подписку Wappi). Подключение к WhatsApp/Telegram активируется после
            первой оплаты.
          </>
        ),
      },
    ],
  },
  {
    title: 'Технические вопросы',
    badge: '⚙️ Tech',
    items: [
      {
        q: 'Какой AI используется?',
        a: (
          <>
            По умолчанию — Claude 3.5 Haiku (Anthropic) через OpenRouter. Это быстрая и
            дешёвая модель ($0.25 / 1M токенов), оптимальная для отельного диалога.
            <br />
            <br />
            Можете переключить на GPT-4o, Claude 3.5 Sonnet, DeepSeek в админке отеля.
            Дороже = умнее = больше счёт у OpenRouter.
          </>
        ),
      },
      {
        q: 'Бот говорит на кыргызском?',
        a: (
          <>
            <strong>Да.</strong> При первом сообщении гостя бот определяет язык
            автоматически и отвечает на нём (русский, английский, кыргызский). Если
            гость пишет на смеси — бот выбирает доминирующий язык.
            <br />
            <br />
            На сегодня (апрель 2026) — 94% гостей пишут по-русски, 6% по-кыргызски (по
            метрикам Ton Azure). Английский — для иностранных гостей.
          </>
        ),
      },
      {
        q: 'Как редактировать промпт после запуска?',
        a: (
          <>
            В админке /dashboard/hotels/[id] есть секция «Системный промпт» с
            production-версией (read-only) и staging-черновиком. Изменили staging →
            протестировали через preview-chat → нажали «Применить в production». Если
            что-то не так — кнопка «Откатить» возвращает предыдущую версию из истории.
          </>
        ),
      },
      {
        q: 'Сколько времени занимает запуск с нуля?',
        a: (
          <>
            Технически — <strong>10-15 минут</strong> через визард (заполняете
            опросник, бот сгенерирован). Но если нужен прогретый WhatsApp-номер — это
            7-14 дней пассивного прогрева до подключения.
            <br />
            <br />
            Если у вас уже есть прогретый номер или используете только Telegram — день
            настройки и тестирования, на 2-й день клиенты уже общаются с ботом. Кейс
            Ton Azure → 14 дней (включая прогрев).
          </>
        ),
      },
    ],
  },
  {
    title: 'Поддержка и обновления',
    badge: '🤝 Support',
    items: [
      {
        q: 'Что если бот ответит неправильно?',
        a: (
          <>
            Самостоятельно — правите промпт через staging → Promote (10 минут). Если
            не помогает или непонятно как — пишете нам, отвечаем в течение 24 часов
            (рабочие). Поправка промпта менеджером Ex-Machina — бесплатно в рамках
            подписки (до 5 правок в месяц).
          </>
        ),
      },
      {
        q: 'Как часто обновляется?',
        a: (
          <>
            Backend — несколько раз в неделю (мелкие фиксы, новые фичи). Все обновления
            автоматические, без downtime. Major-релизы (R2 Exely, R3 multi-manager и
            т.д.) — раз в 2-3 месяца с changelog.
          </>
        ),
      },
      {
        q: 'Можно ли перенести бота на свой сервер?',
        a: (
          <>
            Можем сделать enterprise-deploy на ваш VPS (Contabo / Hetzner / любой
            x86). Это +$300/мес к подписке (поддержка инфры). Для большинства клиентов
            не нужно — наш Railway деплой быстрее, дешевле, надёжнее.
          </>
        ),
      },
    ],
  },
]

export default function FaqContent() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8 text-sm">
          <Link href="/" className="text-[#3B82F6] hover:underline">
            ← На главную
          </Link>
          <Link href="/cases/ton-azure" className="text-zinc-500 hover:text-zinc-300">
            Кейс Ton Azure →
          </Link>
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
          Частые вопросы
        </h1>
        <p className="text-[#A3A3A3] mb-10">
          Если ответа нет — напишите нам в WhatsApp или Telegram, добавим в список.
        </p>

        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-xs px-2 py-1 rounded border border-[#262626] bg-[#0F0F0F] text-zinc-300">
                  {section.badge}
                </span>
                <h2 className="text-xl md:text-2xl font-semibold">{section.title}</h2>
              </div>
              <div className="space-y-2">
                {section.items.map((it, i) => (
                  <FaqItem key={i} q={it.q} a={it.a} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-[#3B82F6]/30 bg-[#3B82F6]/5 p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-2">Не нашли ответа?</h2>
          <p className="text-sm text-[#A3A3A3] mb-4 max-w-2xl">
            Напишите в наш sandbox-бот в Telegram — там же сможете и ответ получить и
            попробовать как Ex-Machina работает.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://t.me/exmachina_sandbox_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm bg-[#3B82F6] hover:bg-[#2563EB] text-white px-5 py-2.5 rounded-md font-medium"
            >
              Написать в Telegram →
            </a>
            <Link
              href="/create-bot"
              className="text-sm border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 px-5 py-2.5 rounded-md"
            >
              Создать бота для своего отеля
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-[#262626] bg-[#0F0F0F] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#141414]"
      >
        <span className="text-sm md:text-base text-[#FAFAFA] font-medium pr-2">{q}</span>
        <span
          className={`text-zinc-500 text-lg transition-transform shrink-0 ${
            open ? 'rotate-45' : ''
          }`}
        >
          +
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-sm text-[#D4D4D4] leading-relaxed border-t border-[#1A1A1A]">
          {a}
        </div>
      )}
    </div>
  )
}
