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

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center text-neutral-400">Загрузка...</div>
      </div>
    )
  }

  if (!hotel) {
    return (
      <div className="p-8">
        <div className="text-center text-neutral-400">Отель не найден</div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: '📊 Обзор' },
    { id: 'dialogs', label: '💬 Диалоги' },
    { id: 'settings', label: '⚙️ Настройки' },
    { id: 'test', label: '🧪 Тест' },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900 mb-4 inline-block">
          ← Назад к списку
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 mb-2 flex items-center gap-3">
              <span className="text-4xl">🏨</span>
              {hotel.name}
            </h1>
            <div className="flex items-center gap-3">
              <Badge variant={hotel.is_active ? 'success' : 'default'}>
                {hotel.is_active ? '✅ Активен' : 'Неактивен'}
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
      <div className="border-b border-neutral-200 mb-6">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium tracking-tight transition-colors ${
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <div className="text-3xl font-semibold mb-1">2.4K</div>
              <div className="text-sm text-neutral-500">Сообщений</div>
            </Card>
            <Card>
              <div className="text-3xl font-semibold mb-1">1.8K</div>
              <div className="text-sm text-neutral-500">Диалогов</div>
            </Card>
            <Card>
              <div className="text-3xl font-semibold mb-1">342</div>
              <div className="text-sm text-neutral-500">Бронирований</div>
            </Card>
            <Card>
              <div className="text-3xl font-semibold mb-1">95%</div>
              <div className="text-sm text-neutral-500">Автоматизация</div>
            </Card>
          </div>

          <Card className="mb-6">
            <h3 className="text-lg font-medium mb-4">Информация об отеле</h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-neutral-500">AI модель:</div>
                <div className="font-medium">{hotel.ai_model}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-neutral-500">Slug:</div>
                <div className="font-medium">{hotel.slug}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-neutral-500">Telegram:</div>
                <div className="font-medium">
                  {hotel.telegram_bot_token ? '✅ Подключен' : '❌ Не подключен'}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-medium mb-4">System Prompt</h3>
            <pre className="text-xs bg-neutral-50 p-4 rounded-lg overflow-x-auto font-mono whitespace-pre-wrap">
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
                Токен Telegram:
              </div>
              <div className="text-sm font-mono bg-neutral-50 p-3 rounded">
                {hotel.telegram_bot_token || 'Не указан'}
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
