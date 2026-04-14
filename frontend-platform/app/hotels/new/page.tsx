'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HotelWizard } from '@/components/hotel/HotelWizard'
import { FullWizard } from '@/components/hotel/FullWizard'
import { Card } from '@/components/ui/card'

export default function NewHotelPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'choose' | 'quick' | 'full'>('choose')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) router.push('/login')
  }, [router])

  if (mode === 'quick') return <HotelWizard />
  if (mode === 'full') return <FullWizard />

  // Mode selection
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Создание AI-бота</h1>
          <p className="text-neutral-500">Выберите режим заполнения</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition border-2 hover:border-blue-500"
            onClick={() => setMode('quick')}
          >
            <div className="text-3xl mb-3">⚡</div>
            <h2 className="text-xl font-semibold mb-2">Быстрый</h2>
            <p className="text-neutral-500 text-sm mb-4">
              3 шага, 5 минут. Для демо на встрече с клиентом. Базовая информация — номера, цены, правила.
            </p>
            <div className="text-xs text-neutral-400">
              Можно дополнить позже через полный режим
            </div>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition border-2 hover:border-blue-500"
            onClick={() => setMode('full')}
          >
            <div className="text-3xl mb-3">📋</div>
            <h2 className="text-xl font-semibold mb-2">Полный</h2>
            <p className="text-neutral-500 text-sm mb-4">
              8 шагов, 20-30 минут. Детальный опросник — все данные для максимально точного бота.
            </p>
            <div className="text-xs text-neutral-400">
              76+ вопросов: окрестности, мероприятия, стиль, продажи
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
