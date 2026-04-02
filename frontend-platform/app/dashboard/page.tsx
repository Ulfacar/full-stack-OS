'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'
import type { Hotel } from '@/lib/types'

export default function DashboardPage() {
  const { data: hotels, isLoading } = useQuery({
    queryKey: ['hotels'],
    queryFn: async () => {
      const response = await api.get('/hotels')
      return response.data as Hotel[]
    },
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 mb-1">
            Мои отели
          </h1>
          <p className="text-neutral-500 text-sm">
            Управляйте AI-ассистентами для ваших отелей
          </p>
        </div>
        <Link href="/hotels/new">
          <Button size="lg">
            + Создать новый бот
          </Button>
        </Link>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12 text-neutral-400">
          Загрузка...
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!hotels || hotels.length === 0) && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🏨</div>
          <h2 className="text-2xl font-medium text-neutral-900 mb-2">
            У вас пока нет ботов
          </h2>
          <p className="text-neutral-500 mb-6">
            Создайте первого AI-ассистента для вашего отеля
          </p>
          <Link href="/hotels/new">
            <Button size="lg">
              Создать первый бот
            </Button>
          </Link>
        </div>
      )}

      {/* Hotels List */}
      {!isLoading && hotels && hotels.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map((hotel) => (
            <Card key={hotel.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏨</span>
                  <h3 className="text-lg font-medium tracking-tight">
                    {hotel.name}
                  </h3>
                </div>
                <Badge variant={hotel.is_active ? 'success' : 'default'}>
                  {hotel.is_active ? '✅ Активен' : 'Неактивен'}
                </Badge>
              </div>

              <div className="space-y-2 mb-6 text-sm text-neutral-600">
                <div>Модель: {hotel.ai_model}</div>
                <div className="text-xs text-neutral-400">
                  Последнее обновление: только что
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link href={`/hotels/${hotel.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Статистика
                  </Button>
                </Link>
                <Link href={`/hotels/${hotel.id}/edit`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Настройки
                  </Button>
                </Link>
                <Link href={`/hotels/${hotel.id}/test`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Тест бота
                  </Button>
                </Link>
                <Link href={`/hotels/${hotel.id}/edit`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Редактировать
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
