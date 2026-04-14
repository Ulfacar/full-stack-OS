'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BotPreview } from '@/components/hotel/BotPreview'
import api from '@/lib/api'
import type { Hotel } from '@/lib/types'

export default function DemoPage() {
  const params = useParams()
  const router = useRouter()
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const res = await api.get(`/hotels/${params.id}`)
        setHotel(res.data)
      } catch {
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) fetchHotel()
  }, [params.id, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-neutral-500">Загрузка...</div>
      </div>
    )
  }

  if (!hotel) return null

  // Build formData from hotel record for BotPreview
  const formData = {
    name: hotel.name,
    description: hotel.description || '',
    address: hotel.address || '',
    phone: hotel.phone || '',
    email: hotel.email || '',
    website: hotel.website || '',
    rooms: hotel.rooms || [],
    rules: hotel.rules || {},
    amenities: hotel.amenities || {},
    communicationStyle: hotel.communication_style || 'friendly',
    aiModel: hotel.ai_model || 'anthropic/claude-3.5-haiku',
    languages: hotel.languages || ['ru', 'en'],
    systemPrompt: hotel.system_prompt || '',
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col">
      {/* Header */}
      <div className="bg-neutral-800 border-b border-neutral-700 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white font-semibold">{hotel.name}</h1>
            <p className="text-neutral-400 text-sm">AI-ассистент готов к работе</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
            >
              В админку
            </Button>
          </div>
        </div>
      </div>

      {/* Phone mockup */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px] h-[700px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-[8px] border-neutral-800 relative">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-neutral-800 rounded-b-2xl z-10" />

          {/* Chat */}
          <div className="h-full pt-6">
            <BotPreview formData={formData} hotelId={hotel.id} fullscreen />
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="bg-neutral-800 border-t border-neutral-700 px-6 py-3 text-center">
        <p className="text-neutral-500 text-xs">
          Ex-Machina Demo — AI-бот создан автоматически на основе данных отеля
        </p>
      </div>
    </div>
  )
}
