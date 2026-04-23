'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  getConversation,
  getConversationMessages,
} from '@/lib/conversationsApi'
import type {
  ConversationCategory,
  ConversationDetail,
  Message,
  MessageSender,
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

const STATUS_LABEL = {
  active: 'Активный',
  needs_operator: 'Ждёт менеджера',
  operator_active: 'С менеджером',
  completed: 'Завершён',
} as const

function clientLabel(client: ConversationDetail['client']): string {
  return client.name || client.telegram_username || client.whatsapp_phone || `Клиент #${client.id}`
}

function channelEmoji(channel: ConversationDetail['channel']): string {
  if (channel === 'telegram') return '✈️'
  if (channel === 'whatsapp') return '💬'
  return '📨'
}

function senderColor(sender: MessageSender | null): string {
  // Bot/operator align right (managed side); client aligns left (incoming).
  if (sender === 'operator') return 'self-end bg-emerald-600/20 border-emerald-500/30 text-emerald-50'
  if (sender === 'bot') return 'self-end bg-[#3B82F6]/15 border-[#3B82F6]/40 text-zinc-100'
  if (sender === 'client') return 'self-start bg-[#262626] border-[#2f2f2f] text-zinc-100'
  // Legacy rows without `sender` (pre-INFRA-1) — fall back to role
  return 'self-start bg-[#1f1f1f] border-[#2a2a2a] text-zinc-300 italic'
}

function senderLabel(sender: MessageSender | null, role: string): string {
  if (sender === 'operator') return 'Менеджер'
  if (sender === 'bot') return 'Бот'
  if (sender === 'client') return 'Клиент'
  return role === 'assistant' ? 'Бот' : role === 'user' ? 'Клиент' : role
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ConversationDetailPage() {
  const params = useParams()
  const hotelId = Number(params.id)
  const conversationId = Number(params.conversationId)

  const [conv, setConv] = useState<ConversationDetail | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const bottomRef = useRef<HTMLDivElement | null>(null)
  const stickToBottomRef = useRef(true)
  const scrollWrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setInterval> | null = null

    const load = async (showSpinner: boolean) => {
      if (showSpinner) setLoading(true)
      try {
        const [detail, msgs] = await Promise.all([
          getConversation(conversationId),
          getConversationMessages(conversationId, { limit: 500 }),
        ])
        if (cancelled) return
        setConv(detail)
        setMessages(msgs)
        setLastUpdated(new Date())
        setError(null)
      } catch (err: any) {
        if (cancelled) return
        const code = err?.response?.status
        if (code === 404) setError('Диалог не найден или у вас нет доступа.')
        else if (code === 401) setError('Сессия истекла — войдите заново.')
        else setError('Не удалось загрузить диалог. Повторим попытку.')
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
  }, [conversationId])

  // Auto-scroll to bottom on new messages — but only if user hasn't scrolled up.
  useEffect(() => {
    if (stickToBottomRef.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages])

  const handleScroll = () => {
    const el = scrollWrapRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distFromBottom < 80
  }

  const cat = (conv?.category ?? 'uncategorized') as ConversationCategory | 'uncategorized'

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA] flex flex-col">
      <div className="max-w-3xl mx-auto w-full px-4 py-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <Link
              href={`/dashboard/hotels/${hotelId}/conversations`}
              className="text-sm text-zinc-400 hover:text-zinc-200"
            >
              ← К ленте диалогов
            </Link>
            <h1 className="text-xl font-semibold mt-1 flex items-center gap-2 truncate">
              <span>{channelEmoji(conv?.channel ?? null)}</span>
              <span className="truncate">{conv ? clientLabel(conv.client) : '…'}</span>
            </h1>
            {conv && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className={`border px-2 py-0.5 rounded ${CATEGORY_COLOR[cat]}`}>
                  {CATEGORY_LABEL[cat]}
                </span>
                <span className="text-zinc-500">
                  {STATUS_LABEL[conv.status as keyof typeof STATUS_LABEL] ?? conv.status}
                </span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-500">{conv.total_messages} сообщений</span>
                {conv.client.language && (
                  <>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-500">язык: {conv.client.language}</span>
                  </>
                )}
              </div>
            )}
          </div>
          {lastUpdated && (
            <span className="text-xs text-zinc-600 shrink-0">
              {lastUpdated.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Client meta card */}
        {conv && (
          <div className="rounded-lg border border-[#262626] bg-[#161616] px-4 py-3 mb-4 text-sm space-y-1">
            <div className="flex items-center gap-2 text-zinc-400">
              <span className="text-zinc-500">Клиент:</span>
              <span className="text-zinc-200">{clientLabel(conv.client)}</span>
            </div>
            {conv.client.telegram_username && (
              <div className="flex items-center gap-2 text-zinc-400">
                <span className="text-zinc-500">Telegram:</span>
                <span className="text-zinc-200">@{conv.client.telegram_username}</span>
              </div>
            )}
            {conv.client.whatsapp_phone && (
              <div className="flex items-center gap-2 text-zinc-400">
                <span className="text-zinc-500">WhatsApp:</span>
                <span className="text-zinc-200">{conv.client.whatsapp_phone}</span>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 mb-3">
            {error}
          </div>
        )}

        {/* Messages */}
        <div
          ref={scrollWrapRef}
          onScroll={handleScroll}
          className="flex-1 min-h-[300px] max-h-[70vh] overflow-y-auto rounded-lg border border-[#262626] bg-[#0F0F0F] p-3"
        >
          {loading && messages.length === 0 ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-12 rounded-lg bg-[#1f1f1f] animate-pulse ${
                    i % 2 === 0 ? 'w-3/5' : 'w-2/5 ml-auto'
                  }`}
                />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-zinc-500 py-10">
              Сообщений пока нет.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-lg border px-3 py-2 text-sm ${senderColor(m.sender)}`}
                >
                  <div className="text-[10px] uppercase tracking-wide opacity-60 mb-0.5">
                    {senderLabel(m.sender, m.role)} · {formatTime(m.created_at)}
                  </div>
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Footer hint — two-way reply will land in Sprint 2 */}
        <p className="text-xs text-zinc-600 mt-3 text-center">
          Только просмотр. Ответ менеджера через бота — в следующем спринте.
        </p>
      </div>
    </div>
  )
}
