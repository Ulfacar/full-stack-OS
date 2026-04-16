'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CardSkeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft, Building2, Bot, MessageSquare, BarChart3,
  Cpu, Link2, Send, Settings, Pencil, Trash2, FlaskConical,
  MessageCircle
} from 'lucide-react'
import api from '@/lib/api'
import type { Hotel } from '@/lib/types'

interface HotelStats {
  messages_total: number
  conversations_total: number
  conversations_month: number
  requests_handled: number
  automation_rate: number
}

export default function HotelDetailPage() {
  const router = useRouter()
  const params = useParams()
  const hotelId = params.id
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) router.push('/login')
  }, [router])

  const { data: hotel, isLoading } = useQuery({
    queryKey: ['hotel', hotelId],
    queryFn: async () => {
      const response = await api.get(`/hotels/${hotelId}`)
      return response.data as Hotel
    },
    enabled: !!hotelId,
  })

  const { data: stats } = useQuery({
    queryKey: ['hotel-stats', hotelId],
    queryFn: async () => {
      try {
        const response = await api.get(`/hotels/${hotelId}/stats`)
        return response.data as HotelStats
      } catch {
        return { messages_total: 0, conversations_total: 0, conversations_month: 0, requests_handled: 0, automation_rate: 0 } as HotelStats
      }
    },
    enabled: !!hotelId,
  })

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8 space-y-6">
        <div className="skeleton h-5 w-20 rounded-lg" />
        <div className="skeleton h-10 w-48 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      </div>
    )
  }

  if (!hotel) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8">
        <Card className="text-center py-16">
          <Building2 size={40} className="mx-auto text-[#262626] mb-4" strokeWidth={1} />
          <p className="text-[#737373] text-sm">Отель не найден</p>
        </Card>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Обзор', icon: BarChart3 },
    { id: 'dialogs', label: 'Диалоги', icon: MessageSquare },
    { id: 'settings', label: 'Настройки', icon: Settings },
    { id: 'test', label: 'Тест', icon: FlaskConical },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8">
      {/* Back */}
      <Link href="/dashboard/hotels" className="inline-flex items-center gap-1.5 text-sm text-[#737373] hover:text-[#FAFAFA] transition-colors mb-6">
        <ArrowLeft size={14} />
        Назад
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-[#FAFAFA] mb-2 flex items-center gap-3">
            {hotel.name}
          </h1>
          <div className="flex items-center gap-3">
            <Badge variant={hotel.is_active ? 'success' : 'default'}>
              <span className={`w-1.5 h-1.5 rounded-full ${hotel.is_active ? 'bg-emerald-500' : 'bg-[#737373]'}`} />
              {hotel.is_active ? 'Активен' : 'Неактивен'}
            </Badge>
            {!hotel.is_active && (
              <Button variant="outline" size="sm">Активировать</Button>
            )}
          </div>
        </div>
        <Link href={`/hotels/${hotel.id}/edit`}>
          <Button variant="outline" className="gap-2">
            <Pencil size={14} />
            Редактировать
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#262626] mb-6 overflow-x-auto no-scrollbar">
        <div className="flex gap-0.5 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium tracking-tight transition-all whitespace-nowrap rounded-t-lg ${
                  activeTab === tab.id
                    ? 'text-[#FAFAFA] bg-[#141414] border border-[#262626] border-b-[#141414] -mb-px shadow-card'
                    : 'text-[#737373] hover:text-[#FAFAFA]'
                }`}
              >
                <Icon size={14} strokeWidth={1.5} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {[
              { label: 'Обработано запросов', value: stats?.requests_handled || 0, icon: Bot, sub: 'этот месяц' },
              { label: 'Диалогов', value: stats?.conversations_month || 0, icon: MessageSquare, sub: 'этот месяц' },
              { label: 'Всего диалогов', value: stats?.conversations_total || 0, icon: MessageCircle, sub: 'за всё время' },
              { label: 'Автоматизация', value: `${stats?.automation_rate || 0}%`, icon: BarChart3, sub: 'бот справился сам' },
            ].map((s, i) => {
              const Icon = s.icon
              return (
                <Card key={s.label} className="p-4 lg:p-5 hover-lift hover:shadow-card-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={14} className="text-[#737373]" strokeWidth={1.5} />
                    <span className="text-xs text-[#737373] tracking-tight">{s.label}</span>
                  </div>
                  <div className="text-2xl lg:text-3xl font-semibold tracking-tight mb-0.5 text-[#FAFAFA]">{s.value}</div>
                  <div className="text-xs text-[#737373]">{s.sub}</div>
                </Card>
              )
            })}
          </div>

          {/* Info */}
          <Card>
            <h3 className="text-base font-semibold tracking-tight mb-4 text-[#FAFAFA]">Информация об отеле</h3>
            <div className="space-y-3 text-sm">
              {[
                { label: 'AI модель', value: hotel.ai_model, icon: Cpu },
                { label: 'Slug', value: hotel.slug, icon: Link2 },
                { label: 'Telegram', value: hotel.has_telegram_bot ? 'Подключен' : 'Не подключен', icon: Send },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-center gap-3 py-2 border-b border-[#1A1A1A] last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] border border-[#262626] flex items-center justify-center">
                      <Icon size={14} className="text-[#737373]" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <span className="text-[#737373]">{item.label}</span>
                    </div>
                    <span className="font-medium tracking-tight text-[#FAFAFA]">{item.value}</span>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* System Prompt */}
          <Card>
            <h3 className="text-base font-semibold tracking-tight mb-4 text-[#FAFAFA]">System Prompt</h3>
            <pre className="text-xs bg-[#1A1A1A] p-4 rounded-xl overflow-x-auto font-mono whitespace-pre-wrap break-words text-[#A3A3A3] border border-[#262626]">
              {hotel.system_prompt}
            </pre>
          </Card>
        </div>
      )}

      {activeTab === 'dialogs' && (
        <Card className="animate-fade-in">
          <div className="text-center py-16">
            <MessageSquare size={40} className="mx-auto text-[#262626] mb-4" strokeWidth={1} />
            <p className="text-[#A3A3A3] font-medium text-sm">История диалогов будет отображаться здесь</p>
            <p className="text-[#737373] text-xs mt-1">Пока бот не получил сообщений</p>
          </div>
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card className="animate-fade-in">
          <h3 className="text-base font-semibold tracking-tight mb-5 text-[#FAFAFA]">Настройки бота</h3>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-[#737373] mb-2">Токен Telegram:</div>
              <div className="text-sm font-mono bg-[#1A1A1A] p-3.5 rounded-xl break-all border border-[#262626] text-[#A3A3A3]">
                {hotel.has_telegram_bot ? 'Подключен' : 'Не указан'}
              </div>
            </div>
            <div className="pt-6 border-t border-[#262626]">
              <h4 className="text-sm font-medium text-red-400 mb-3 tracking-tight">Опасная зона</h4>
              <Button variant="destructive" size="sm" className="gap-2">
                <Trash2 size={14} />
                Удалить бота
              </Button>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'test' && (
        <Card className="animate-fade-in">
          <div className="text-center py-16">
            <FlaskConical size={40} className="mx-auto text-[#262626] mb-4" strokeWidth={1} />
            <p className="text-[#A3A3A3] font-medium text-sm">Тестирование бота</p>
            <p className="text-[#737373] text-xs mt-1 mb-6">
              Отправьте сообщение вашему боту в Telegram для тестирования
            </p>
            <Button className="gap-2">
              <Send size={14} />
              Открыть бота в Telegram
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
