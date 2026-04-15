'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
    if (!token) {
      router.push('/login')
    }
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
        // Fallback mock until API is ready
        return {
          messages_total: 0,
          conversations_total: 0,
          conversations_month: 0,
          requests_handled: 0,
          automation_rate: 0,
        } as HotelStats
      }
    },
    enabled: !!hotelId,
  })

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8">
        <div className="text-center text-neutral-400">Загрузка...</div>
      </div>
    )
  }

  if (!hotel) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8">
        <div className="text-center text-neutral-400">Отель не найден</div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Обзор' },
    { id: 'dialogs', label: 'Диалоги' },
    { id: 'settings', label: 'Настройки' },
    { id: 'test', label: 'Тест' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900 mb-4 inline-block">
          ← Назад к списку
        </Link>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-neutral-900 mb-2 flex items-center gap-3">
              {hotel.name}
            </h1>
            <div className="flex items-center gap-3">
              <Badge variant={hotel.is_active ? 'success' : 'default'}>
                {hotel.is_active ? 'Активен' : 'Неактивен'}
              </Badge>
              {!hotel.is_active && (
                <Button variant="outline" size="sm">
                  Активировать
                </Button>
              )}
            </div>
          </div>

          <Link href={`/hotels/${hotel.id}/edit`}>
            <Button variant="outline">
              Редактировать
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 mb-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium tracking-tight transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-neutral-900 border-b-2 border-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          {/* Stats cards - hotel manager sees request count, not $ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
            <Card className="p-4 lg:p-6">
              <div className="text-2xl lg:text-3xl font-semibold mb-1">
                {stats?.requests_handled || 0}
              </div>
              <div className="text-xs lg:text-sm text-neutral-500">
                Обработано запросов
              </div>
              <div className="text-xs text-neutral-400 mt-1">этот месяц</div>
            </Card>
            <Card className="p-4 lg:p-6">
              <div className="text-2xl lg:text-3xl font-semibold mb-1">
                {stats?.conversations_month || 0}
              </div>
              <div className="text-xs lg:text-sm text-neutral-500">Диалогов</div>
              <div className="text-xs text-neutral-400 mt-1">этот месяц</div>
            </Card>
            <Card className="p-4 lg:p-6">
              <div className="text-2xl lg:text-3xl font-semibold mb-1">
                {stats?.conversations_total || 0}
              </div>
              <div className="text-xs lg:text-sm text-neutral-500">Всего диалогов</div>
              <div className="text-xs text-neutral-400 mt-1">за всё время</div>
            </Card>
            <Card className="p-4 lg:p-6">
              <div className="text-2xl lg:text-3xl font-semibold mb-1">
                {stats?.automation_rate || 0}%
              </div>
              <div className="text-xs lg:text-sm text-neutral-500">Автоматизация</div>
              <div className="text-xs text-neutral-400 mt-1">бот справился сам</div>
            </Card>
          </div>

          {/* Hotel info */}
          <Card className="mb-4 lg:mb-6">
            <h3 className="text-lg font-medium mb-4">Информация об отеле</h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="text-neutral-500">AI модель:</div>
                <div className="font-medium">{hotel.ai_model}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="text-neutral-500">Slug:</div>
                <div className="font-medium">{hotel.slug}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="text-neutral-500">Telegram:</div>
                <div className="font-medium">
                  {hotel.has_telegram_bot ? 'Подключен' : 'Не подключен'}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-medium mb-4">System Prompt</h3>
            <pre className="text-xs bg-neutral-50 p-3 lg:p-4 rounded-lg overflow-x-auto font-mono whitespace-pre-wrap break-words">
              {hotel.system_prompt}
            </pre>
          </Card>
        </div>
      )}

      {activeTab === 'dialogs' && (
        <Card>
          <div className="text-center py-12 text-neutral-500">
            <div className="text-4xl mb-4">💬</div>
            <p>История диалогов будет отображаться здесь</p>
            <p className="text-sm mt-2">
              Пока бот не получил сообщений
            </p>
          </div>
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card>
          <h3 className="text-lg font-medium mb-4">Настройки бота</h3>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-neutral-500 mb-2">
                Telegram:
              </div>
              <div className="text-sm font-mono bg-neutral-50 p-3 rounded break-all">
                {hotel.has_telegram_bot ? 'Подключен' : 'Не подключен'}
              </div>
            </div>

            <div className="pt-6 border-t border-neutral-200">
              <h4 className="text-sm font-medium text-red-600 mb-3">
                Опасная зона
              </h4>
              <Button variant="destructive" size="sm">
                Удалить бота
              </Button>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'test' && (
        <Card>
          <div className="text-center py-12 text-neutral-500">
            <div className="text-4xl mb-4">🧪</div>
            <p>Тестирование бота</p>
            <p className="text-sm mt-2 mb-6">
              Отправьте сообщение вашему боту в Telegram для тестирования
            </p>
            <Button>
              Открыть бота в Telegram
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
