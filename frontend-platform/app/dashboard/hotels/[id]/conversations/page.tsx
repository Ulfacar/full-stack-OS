'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import {
  getConversations,
  getConversationStats,
} from '@/lib/conversationsApi'
import type {
  ConversationCategory,
  ConversationListItem,
  ConversationStats,
  ConversationStatus,
} from '@/lib/types'

const POLL_INTERVAL_MS = 10_000

const CATEGORY_LABEL: Record<ConversationCategory | 'uncategorized', string> = {
  booking: 'Бронь',
  hotel: 'Отель',
  service: 'Сервис',
  general: 'Общий',
  uncategorized: 'Без темы',
}

const CATEGORY_COLOR: Record<ConversationCategory | 'uncategorized', string> = {
  booking: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  hotel: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  service: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  general: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
  uncategorized: 'bg-zinc-700/30 text-zinc-400 border-zinc-700',
}

const STATUS_LABEL: Record<ConversationStatus, string> = {
  active: 'Активный',
  needs_operator: 'Ждёт менеджера',
  operator_active: 'С менеджером',
  completed: 'Завершён',
}

const STATUS_FILTER: { key: ConversationStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'active', label: 'Активные' },
  { key: 'needs_operator', label: 'Ждут менеджера' },
  { key: 'operator_active', label: 'С менеджером' },
  { key: 'completed', label: 'Завершённые' },
]

const CATEGORY_FILTER: { key: ConversationCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'Все темы' },
  { key: 'booking', label: 'Бронь' },
  { key: 'hotel', label: 'Отель' },
  { key: 'service', label: 'Сервис' },
  { key: 'general', label: 'Общий' },
]

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '—'
  const ts = new Date(iso).getTime()
  if (Number.isNaN(ts)) return '—'
  const diffMin = Math.round((Date.now() - ts) / 60_000)
  if (diffMin < 1) return 'только что'
  if (diffMin < 60) return `${diffMin} мин назад`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `${diffH} ч назад`
  const diffD = Math.round(diffH / 24)
  if (diffD === 1) return 'вчера'
  if (diffD < 7) return `${diffD} дн назад`
  return new Date(ts).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

function clientLabel(client: ConversationListItem['client']): string {
  return client.name || client.telegram_username || client.whatsapp_phone || `Клиент #${client.id}`
}

function channelEmoji(channel: ConversationListItem['channel']): string {
  if (channel === 'telegram') return '✈️'
  if (channel === 'whatsapp') return '💬'
  return '📨'
}

export default function HotelConversationsPage() {
  const params = useParams()
  const router = useRouter()
  const hotelId = Number(params.id)

  const [conversations, setConversations] = useState<ConversationListItem[]>([])
  const [stats, setStats] = useState<ConversationStats | null>(null)
  const [category, setCategory] = useState<ConversationCategory | 'all'>('all')
  const [status, setStatus] = useState<ConversationStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const filtersRef = useRef({ category, status })
  filtersRef.current = { category, status }

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setInterval> | null = null

    const load = async (showSpinner: boolean) => {
      if (showSpinner) setLoading(true)
      try {
        const { category: cat, status: st } = filtersRef.current
        const params = {
          hotel_id: hotelId,
          ...(cat !== 'all' ? { category: cat } : {}),
          ...(st !== 'all' ? { status: st } : {}),
          limit: 100,
        }
        const [items, statsRes] = await Promise.all([
          getConversations(params),
          getConversationStats(hotelId),
        ])
        if (cancelled) return
        setConversations(items)
        setStats(statsRes)
        setLastUpdated(new Date())
        setError(null)
      } catch (err: any) {
        if (cancelled) return
        const code = err?.response?.status
        if (code === 404) setError('Отель не найден или у вас нет доступа.')
        else if (code === 401) setError('Сессия истекла — войдите заново.')
        else setError('Не удалось загрузить диалоги. Повторим попытку.')
      } finally {
        if (!cancelled && showSpinner) setLoading(false)
      }
    }

    load(true)
    timer = setInterval(() => load(false), POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
    }
  }, [hotelId, category, status])

  const totalUnread = stats?.unread_total ?? 0

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
      const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
      return tb - ta
    })
  }, [conversations])

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA]">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <Link
              href={`/dashboard/hotels/${hotelId}`}
              className="text-sm text-zinc-400 hover:text-zinc-200"
            >
              ← К отелю
            </Link>
            <h1 className="text-2xl font-semibold mt-1">Диалоги</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {stats ? (
                <>
                  Всего: <span className="text-zinc-300">{stats.total}</span>
                  {' · '}
                  Непрочитанных: <span className="text-zinc-300">{totalUnread}</span>
                </>
              ) : (
                'Загрузка статистики…'
              )}
            </p>
          </div>
          {lastUpdated && (
            <span className="text-xs text-zinc-600">
              Обновлено в {lastUpdated.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          {CATEGORY_FILTER.map(({ key, label }) => {
            const count =
              key === 'all'
                ? stats?.total
                : stats?.by_category?.[key as ConversationCategory]
            const active = category === key
            return (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${
                  active
                    ? 'bg-[#3B82F6] text-white border-[#3B82F6]'
                    : 'bg-[#262626] text-zinc-300 border-[#262626] hover:border-zinc-600'
                }`}
              >
                {label}
                {count !== undefined && (
                  <span className={`ml-1.5 ${active ? 'text-white/80' : 'text-zinc-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTER.map(({ key, label }) => {
            const count =
              key === 'all'
                ? stats?.total
                : stats?.by_status?.[key as ConversationStatus]
            const active = status === key
            return (
              <button
                key={key}
                onClick={() => setStatus(key)}
                className={`px-3 py-1 rounded-full text-xs border transition ${
                  active
                    ? 'bg-zinc-200 text-[#0A0A0A] border-zinc-200'
                    : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500'
                }`}
              >
                {label}
                {count !== undefined && (
                  <span className={`ml-1 ${active ? 'text-zinc-600' : 'text-zinc-600'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* List */}
        {loading && conversations.length === 0 ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 rounded-lg bg-[#262626] animate-pulse"
              />
            ))}
          </div>
        ) : sortedConversations.length === 0 ? (
          <Card className="bg-[#262626] border-[#262626] text-center py-10 text-zinc-500">
            Диалогов в этой выборке пока нет.
          </Card>
        ) : (
          <div className="space-y-2">
            {sortedConversations.map((conv) => {
              const cat = (conv.category ?? 'uncategorized') as ConversationCategory | 'uncategorized'
              return (
                <button
                  key={conv.id}
                  onClick={() =>
                    router.push(`/dashboard/hotels/${hotelId}/conversations/${conv.id}`)
                  }
                  className="w-full text-left rounded-lg bg-[#262626] hover:bg-[#2f2f2f] border border-[#262626] hover:border-zinc-700 transition px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span>{channelEmoji(conv.channel)}</span>
                        <span className="font-medium truncate">{clientLabel(conv.client)}</span>
                        <span
                          className={`shrink-0 border text-xs px-2 py-0.5 rounded font-normal ${CATEGORY_COLOR[cat]}`}
                        >
                          {CATEGORY_LABEL[cat]}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400 mt-1.5 line-clamp-2">
                        {conv.last_message_preview || <span className="italic">Без сообщений</span>}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                        <span>{formatRelativeTime(conv.last_message_at ?? conv.updated_at)}</span>
                        <span>·</span>
                        <span>{STATUS_LABEL[conv.status] ?? conv.status}</span>
                      </div>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="shrink-0 inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-[#3B82F6] text-white text-xs font-semibold">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
